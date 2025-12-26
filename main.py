import uuid, random, json, asyncio, time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import Dict, Any, Optional, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# === TRANSLATIONS ===
TRANSLATIONS = {
    "en": {
        "room_exists": "Room already exists",
        "room_not_found": "Room not found",
        "invalid_name": "Invalid name",
        "name_taken": "Name taken",
        "invalid_credentials": "Invalid credentials",
        "only_host_start": "Only the host can start the game",
        "need_players": "Need at least 2 players",
        "game_started": "Game already started",
        "game_starting": "{player} started the game!",
        "not_enough_players": "Not enough players",
        "all_questions_completed": "All questions completed",
        "player_left": "{player} left the game",
        "new_host": "{host} is now the host",
        "correct": "✅ Correct!",
        "wrong": "❌ Wrong! Answer: {answer}",
        "timeout": "⏰ Time's up!",
        "buzzed": "🔔 {player} buzzed!",
        "round_complete": "Round {round} Complete!",
        "player_eliminated": "{player} has been eliminated!",
        "final_round": "Final Round!",
        "round_starting": "Round {round} Starting...",
        "team_eliminated": "Team {team} has been eliminated!",
        "need_four_players": "Need exactly 4 players for team mode",
        "team_full": "That team is full (max 2 players per team)",
        "select_team": "Select Your Team:",
        "team_red": "Red Team",
        "team_blue": "Blue Team"
    },
    "fr": {
        "room_exists": "La salle existe déjà",
        "room_not_found": "Salle non trouvée",
        "invalid_name": "Nom invalide",
        "name_taken": "Nom déjà pris",
        "invalid_credentials": "Identifiants invalides",
        "only_host_start": "Seul l'hôte peut démarrer le jeu",
        "need_players": "Au moins 2 joueurs nécessaires",
        "game_started": "Jeu déjà commencé",
        "game_starting": "{player} a démarré le jeu !",
        "not_enough_players": "Pas assez de joueurs",
        "all_questions_completed": "Toutes les questions terminées",
        "player_left": "{player} a quitté le jeu",
        "new_host": "{host} est maintenant l'hôte",
        "correct": "✅ Correct !",
        "wrong": "❌ Faux ! Réponse : {answer}",
        "timeout": "⏰ Temps écoulé !",
        "buzzed": "🔔 {player} a buzzer !",
        "round_complete": "Manche {round} Terminée !",
        "player_eliminated": "{player} a été éliminé !",
        "final_round": "Manche Finale !",
        "round_starting": "Manche {round} Commence...",
        "team_eliminated": "Équipe {team} a été éliminée !",
        "need_four_players": "Exactement 4 joueurs nécessaires pour le mode équipe",
        "team_full": "Cette équipe est pleine (max 2 joueurs par équipe)",
        "select_team": "Sélectionnez votre équipe:",
        "team_red": "Équipe Rouge",
        "team_blue": "Équipe Bleue"
    }
}

def get_text(lang: str, key: str, **kwargs) -> str:
    text = TRANSLATIONS.get(lang, TRANSLATIONS["en"]).get(key, key)
    if kwargs:
        text = text.format(**kwargs)
    return text

# === LOAD QUESTIONS ===
try:
    with open("questions.json", "r", encoding="utf-8") as f:
        ALL_QUESTIONS = json.load(f)
except FileNotFoundError:
    raise RuntimeError("questions.json not found")

# === GLOBAL STATE ===
rooms: Dict[str, Dict] = {}
connections: Dict[str, Dict[str, WebSocket]] = {}
room_locks: Dict[str, asyncio.Lock] = {}

# === HELPERS ===
def get_room(code: str) -> Optional[Dict]:
    return rooms.get(code)

async def broadcast(code: str, event: str, data: Any, exclude: Optional[str] = None):
    for user_id, ws in connections.get(code, {}).items():
        if exclude and user_id == exclude:
            continue
        try:
            await ws.send_json({"event": event, "data": data})
        except Exception as e:
            print(f"Error broadcasting to {user_id}: {e}")

async def send_to_user(code: str, user_id: str, event: str, data: Any):
    ws = connections.get(code, {}).get(user_id)
    if ws:
        try:
            await ws.send_json({"event": event, "data": data})
        except Exception as e:
            print(f"Error sending to {user_id}: {e}")

def validate_player_name(name: str) -> bool:
    if not name or not isinstance(name, str):
        return False
    name = name.strip()
    return 1 <= len(name) <= 20 and name.isprintable()

async def cleanup_room(code: str):
    rooms.pop(code, None)
    connections.pop(code, None)
    room_locks.pop(code, None)

async def timer_task(code: str):
    room = get_room(code)
    if not room:
        return
    
    start_time = time.time()
    duration = room["timer"]
    
    while time.time() - start_time < duration:
        if room["answered"] or code not in rooms:
            return
        await asyncio.sleep(0.1)
    
    if not room["answered"] and room["buzzed"]:
        async with room_locks[code]:
            if not room["answered"]:
                room["answered"] = True
                q = room["current_q"]
                lang = room.get("language", "en")
                
                await broadcast(code, "answerResult", {
                    "correct": False,
                    "answer": q["options"][q["correct"]],
                    "scores": {p["name"]: p["score"] for p in room["players"].values()},
                    "timeout": True,
                    "message": get_text(lang, "timeout"),
                    "teamScores": room.get("teams") if room["game_mode"] == "team" else None
                })
                
                await asyncio.sleep(3)
                await next_question(code)

async def eliminate_lowest_player(code: str):
    """Eliminate the player with the lowest score"""
    room = get_room(code)
    if not room:
        return False
    
    lang = room.get("language", "en")
    
    # Get active players only
    active_players = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
    
    if len(active_players) <= 1:
        # Only one player left - they win! END GAME IMMEDIATELY
        winner = list(active_players.values())[0] if active_players else None
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": winner["name"] if winner else None,
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
        })
        await cleanup_room(code)
        return True  # Signal that game ended
    
    # Find player with lowest score
    lowest_player_id = min(active_players.keys(), key=lambda uid: active_players[uid]["score"])
    lowest_player = room["players"][lowest_player_id]
    
    # Mark player as eliminated (not active)
    lowest_player["active"] = False
    
    # Broadcast elimination
    await broadcast(code, "playerEliminated", {
        "player": lowest_player["name"],
        "score": lowest_player["score"],
        "message": get_text(lang, "player_eliminated", player=lowest_player["name"]),
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "activePlayers": [p["name"] for uid, p in room["players"].items() if p.get("active", True)]
    })
    
    # Check again after elimination
    remaining_active = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
    if len(remaining_active) == 1:
        # Only one player remains after elimination - END GAME
        winner = list(remaining_active.values())[0]
        await asyncio.sleep(3)  # Brief pause after elimination message
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": winner["name"],
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
        })
        await cleanup_room(code)
        return True  # Signal that game ended
    
    return False  # Game continues

async def eliminate_lowest_team(code: str):
    """Eliminate the team with the lowest score"""
    room = get_room(code)
    if not room:
        return False
    
    lang = room.get("language", "en")
    teams = room.get("teams")
    
    if not teams:
        return False
    
    # Get active teams
    active_teams = {name: team for name, team in teams.items() if team.get("active", True)}
    
    if len(active_teams) <= 1:
        # Only one team left
        winner_team = list(active_teams.keys())[0] if active_teams else None
        team_name = get_text(lang, f"team_{winner_team}")
        
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": team_name,
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
            "teamScores": teams
        })
        await cleanup_room(code)
        return True
    
    # Find team with lowest score
    lowest_team = min(active_teams.keys(), key=lambda t: active_teams[t]["score"])
    teams[lowest_team]["active"] = False
    
    # Mark all players in that team as eliminated
    for uid, player in room["players"].items():
        if player.get("team") == lowest_team:
            player["active"] = False
    
    team_name = get_text(lang, f"team_{lowest_team}")
    
    await broadcast(code, "teamEliminated", {
        "team": lowest_team,
        "teamName": team_name,
        "message": get_text(lang, "team_eliminated", team=team_name),
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "teamScores": teams
    })
    
    # Check if only one team remains
    remaining_teams = {name: team for name, team in teams.items() if team.get("active", True)}
    if len(remaining_teams) == 1:
        winner_team = list(remaining_teams.keys())[0]
        team_name = get_text(lang, f"team_{winner_team}")
        await asyncio.sleep(3)
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": team_name,
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
            "teamScores": teams
        })
        await cleanup_room(code)
        return True
    
    return False

async def start_next_round(code: str):
    """Start the next round"""
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    
    # Check if only one player/team remains
    if room["game_mode"] == "team":
        active_teams = {name: team for name, team in room["teams"].items() if team.get("active", True)}
        if len(active_teams) <= 1:
            winner_team = list(active_teams.keys())[0] if active_teams else None
            team_name = get_text(lang, f"team_{winner_team}") if winner_team else None
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "winner": team_name,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
                "teamScores": room["teams"]
            })
            await cleanup_room(code)
            return
    else:
        active_players = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
        if len(active_players) <= 1:
            winner = list(active_players.values())[0] if active_players else None
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "winner": winner["name"] if winner else None,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
            })
            await cleanup_room(code)
            return
    
    # Increment round
    room["current_round"] += 1
    room["questions_in_round"] = 0
    
    if room["current_round"] > room["max_rounds"]:
        # Game over - find winner
        if room["game_mode"] == "team":
            active_teams = {name: team for name, team in room["teams"].items() if team.get("active", True)}
            winner_team = max(active_teams.keys(), key=lambda t: active_teams[t]["score"]) if active_teams else None
            team_name = get_text(lang, f"team_{winner_team}") if winner_team else None
            
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "winner": team_name,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
                "teamScores": room["teams"]
            })
        else:
            active_players = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
            winner = max(active_players.values(), key=lambda p: p["score"], default=None) if active_players else None
            
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "winner": winner["name"] if winner else None,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
            })
        await cleanup_room(code)
        return
    
    # Show round transition
    round_msg = get_text(lang, "final_round") if room["current_round"] == room["max_rounds"] else get_text(lang, "round_starting", round=room["current_round"])
    
    await broadcast(code, "roundTransition", {
        "round": room["current_round"],
        "maxRounds": room["max_rounds"],
        "message": round_msg,
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "activePlayers": [p["name"] for uid, p in room["players"].items() if p.get("active", True)],
        "teamScores": room.get("teams") if room["game_mode"] == "team" else None
    })
    
    await asyncio.sleep(3)
    await start_question(code)

# === ROUTES ===
@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/questions")
async def get_questions(language: str = "en", subjects: str = ""):
    subject_list = [s.strip() for s in subjects.split(",") if s.strip()]
    
    if not subject_list:
        subject_list = list(ALL_QUESTIONS.get(language, {}).keys())
    
    questions = []
    for subject in subject_list:
        if subject in ALL_QUESTIONS.get(language, {}):
            questions.extend(ALL_QUESTIONS[language][subject])
    
    random.shuffle(questions)
    return {"questions": questions[:20]}

# === WEBSOCKET ===
@app.websocket("/ws/{code}")
async def websocket_endpoint(ws: WebSocket, code: str):
    await ws.accept()
    code = code.upper()[:6]
    user_id = None
    
    try:
        while True:
            msg = await ws.receive_json()
            action = msg.get("action")

            if action == "create":
                if code in rooms:
                    lang = msg.get("language", "en")
                    await ws.send_json({"event": "error", "data": get_text(lang, "room_exists")})
                    continue
                
                language = msg.get("language", "en")
                subjects = msg.get("subjects", [])
                game_mode = msg.get("gameMode", "ffa")
                
                rooms[code] = {
                    "players": {},
                    "current_q": None,
                    "timer": 0,
                    "buzzed": None,
                    "answered": False,
                    "available": [],
                    "created_at": time.time(),
                    "state": "waiting",
                    "host": None,
                    "language": language,
                    "subjects": subjects,
                    "current_round": 1,
                    "questions_in_round": 0,
                    "max_rounds": 3,
                    "questions_per_round": 5,
                    "game_mode": game_mode,
                    "teams": {"red": {"score": 0, "active": True}, "blue": {"score": 0, "active": True}} if game_mode == "team" else None
                }
                connections[code] = {}
                room_locks[code] = asyncio.Lock()
                
                await ws.send_json({"event": "roomCreated", "data": {"code": code, "language": language, "gameMode": game_mode}})

            
            elif action == "getRoomInfo":
              room = get_room(code)
              if not room:
                 await ws.send_json({"event": "error", "data": "Room not found"})
                 await ws.close()
                 return
              
              # Calculate team counts
              team_counts = None
              if room["game_mode"] == "team":
                  team_counts = {
                      "red": sum(1 for p in room["players"].values() if p.get("team") == "red"),
                      "blue": sum(1 for p in room["players"].values() if p.get("team") == "blue")
                                }
              await ws.send_json({
                  "event": "roomInfo",
                  "data": {
                     "gameMode": room["game_mode"],
                     "playerCount": len(room["players"]),
                     "teamCounts": team_counts
                          }
                                 })
              await asyncio.sleep(0.1)
              await ws.close()  # Close temp connection
              return
            
            elif action == "join":
                room = get_room(code)
                if not room:
                    lang = msg.get("language", "en")
                    await ws.send_json({"event": "error", "data": get_text(lang, "room_not_found")})
                    continue

                lang = room.get("language", "en")
                name = msg.get("playerName", "").strip()
                selected_team = msg.get("team")  # NEW: Get team selection from player
                
                if not validate_player_name(name):
                    await ws.send_json({"event": "error", "data": get_text(lang, "invalid_name")})
                    continue

                if any(p["name"].lower() == name.lower() for p in room["players"].values()):
                    await ws.send_json({"event": "error", "data": get_text(lang, "name_taken")})
                    continue

                user_id = str(uuid.uuid4())
                match_token = uuid.uuid4().hex
                
                # Assign team if team mode
                team = None
                if room["game_mode"] == "team":
                   if selected_team and selected_team in ["red", "blue"]:
                         # Check if team is full (max 2 players per team)
                         team_count = sum(1 for p in room["players"].values() if p.get("team") == selected_team)
                         if team_count >= 2:
                          await ws.send_json({"event": "error", "data": get_text(lang, "team_full")})
                          continue
                         team = selected_team
                   else:
                         # Auto-assign to team with fewer players
                         red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                         blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                         team = "red" if red_count <= blue_count else "blue"

                room["players"][user_id] = {
                    "name": name,
                    "match_token": match_token,
                    "score": 0,
                    "joined_at": time.time(),
                    "active": True,
                    "team": team
                }
                
                if room["host"] is None:
                    room["host"] = user_id
                
                connections[code][user_id] = ws

                await ws.send_json({
                    "event": "joined",
                    "data": {
                        "userId": user_id,
                        "matchToken": match_token,
                        "isHost": user_id == room["host"],
                        "language": lang,
                        "team": team
                    }
                })

                # Determine if can start
                can_start = False
                if room["game_mode"] == "team":
                    red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                    blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    can_start = len(room["players"]) == 4 and red_count == 2 and blue_count == 2
                else:
                    can_start = len(room["players"]) >= 2

                await broadcast(code, "players", {
                    "players": [
                        {
                            "name": p["name"], 
                            "score": p["score"],
                            "isHost": uid == room["host"],
                            "team": p.get("team")
                        }
                        for uid, p in room["players"].items()
                    ],
                    "count": len(room["players"]),
                    "canStart": can_start,
                    "gameMode": room["game_mode"],
                    "teamCounts": {
                        "red": sum(1 for p in room["players"].values() if p.get("team") == "red"),
                        "blue": sum(1 for p in room["players"].values() if p.get("team") == "blue")
                }   if room["game_mode"] == "team" else None
                     })

            elif action == "start":
                room = get_room(code)
                if not room:
                    continue
                
                lang = room.get("language", "en")
                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                
                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    await ws.send_json({"event": "error", "data": get_text(lang, "invalid_credentials")})
                    continue
                
                if msg_user_id != room["host"]:
                    await ws.send_json({"event": "error", "data": get_text(lang, "only_host_start")})
                    continue
                
                # Check player count based on game mode
                if room["game_mode"] == "team":
                    if len(room["players"]) != 4:
                        await ws.send_json({"event": "error", "data": get_text(lang, "need_four_players")})
                        continue
                else:
                    if len(room["players"]) < 2:
                        await ws.send_json({"event": "error", "data": get_text(lang, "need_players")})
                        continue
                
                if room["state"] != "waiting":
                    await ws.send_json({"event": "error", "data": get_text(lang, "game_started")})
                    continue
                
                room["state"] = "question"
                await broadcast(code, "gameStarting", {
                    "startedBy": player["name"],
                    "message": get_text(lang, "game_starting", player=player["name"])
                })
                await asyncio.sleep(2)
                await start_question(code)

            elif action == "buzz":
                room = get_room(code)
                if not room:
                    continue
                
                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                lang = room.get("language", "en")

                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    continue
                
                if not player.get("active", True):
                    await send_to_user(code, msg_user_id, "error", "You have been eliminated and cannot buzz")
                    continue

                async with room_locks[code]:
                    if room["state"] != "question" or room["buzzed"] or room["answered"]:
                        continue

                    room["buzzed"] = msg_user_id
                    room["state"] = "buzzed"
                    
                    await broadcast(code, "buzzed", {
                        "player": player["name"],
                        "message": get_text(lang, "buzzed", player=player["name"])
                    })

            elif action == "answer":
                room = get_room(code)
                if not room:
                    continue
                
                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                idx = msg.get("idx")
                lang = room.get("language", "en")

                if not isinstance(idx, int):
                    continue

                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    continue
                
                if not player.get("active", True):
                    await send_to_user(code, msg_user_id, "error", "You have been eliminated and cannot answer")
                    continue

                async with room_locks[code]:
                    if room["buzzed"] != msg_user_id or room["answered"]:
                        continue

                    room["answered"] = True
                    room["state"] = "answered"
                    q = room["current_q"]

                    if not (0 <= idx < len(q["options"])):
                        continue

                    correct = idx == q["correct"]
                    if correct:
                        player["score"] += 1
                        # Add score to team if team mode
                        if room["game_mode"] == "team" and player.get("team"):
                            room["teams"][player["team"]]["score"] += 1

                    correct_answer = q["options"][q["correct"]]
                    message = get_text(lang, "correct") if correct else get_text(lang, "wrong", answer=correct_answer)

                    await broadcast(code, "answerResult", {
                        "correct": correct,
                        "answer": correct_answer,
                        "answeredBy": player["name"],
                        "message": message,
                        "scores": {p["name"]: p["score"] for p in room["players"].values()},
                        "teamScores": room.get("teams") if room["game_mode"] == "team" else None
                    })

                    await asyncio.sleep(3)
                    await next_question(code)

    except WebSocketDisconnect:
        pass
    finally:
        if code in connections and user_id in connections[code]:
            connections[code].pop(user_id, None)
        
        room = get_room(code)
        if room and user_id in room["players"]:
            player_name = room["players"][user_id]["name"]
            was_host = (user_id == room["host"])
            lang = room.get("language", "en")
            room["players"].pop(user_id)
            
            if was_host and room["players"]:
                new_host = next(iter(room["players"].keys()))
                room["host"] = new_host
                await broadcast(code, "newHost", {
                    "hostName": room["players"][new_host]["name"],
                    "message": get_text(lang, "new_host", host=room["players"][new_host]["name"])
                })
            
            await broadcast(code, "playerLeft", {
                "player": player_name,
                "remaining": len(room["players"]),
                "message": get_text(lang, "player_left", player=player_name)
            })
            
            # Check based on game mode
            min_players = 4 if room.get("game_mode") == "team" else 2
            if len(room["players"]) < min_players:
                await broadcast(code, "gameOver", {
                    "reason": get_text(lang, "not_enough_players"),
                    "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
                    "teamScores": room.get("teams") if room.get("game_mode") == "team" else None
                })
                await cleanup_room(code)

# === GAME LOGIC ===
async def start_question(code: str):
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    subjects = room.get("subjects", [])

    if not room["available"]:
        questions = []
        for subject in subjects:
            if subject in ALL_QUESTIONS.get(lang, {}):
                questions.extend(ALL_QUESTIONS[lang][subject])
        
        if not questions:
            for subject in ALL_QUESTIONS.get(lang, {}).keys():
                questions.extend(ALL_QUESTIONS[lang][subject])
        
        room["available"] = questions.copy()
        random.shuffle(room["available"])

    if not room["available"]:
        if room["game_mode"] == "team":
            active_teams = {name: team for name, team in room["teams"].items() if team.get("active", True)}
            winner_team = max(active_teams.keys(), key=lambda t: active_teams[t]["score"]) if active_teams else None
            team_name = get_text(lang, f"team_{winner_team}") if winner_team else None
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "winner": team_name,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
                "teamScores": room["teams"]
            })
        else:
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "all_questions_completed"),
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
            })
        await cleanup_room(code)
        return

    q = room["available"].pop()
    room["current_q"] = q
    room["timer"] = q.get("time", 10)
    room["buzzed"] = None
    room["answered"] = False
    room["state"] = "question"
    room["questions_in_round"] += 1

    await broadcast(code, "question", {
        "q": q["q"],
        "options": q["options"],
        "time": room["timer"],
        "remaining": len(room["available"]),
        "round": room["current_round"],
        "questionInRound": room["questions_in_round"],
        "questionsPerRound": room["questions_per_round"]
    })
    
    asyncio.create_task(timer_task(code))

async def next_question(code: str):
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    
    # Check if round is complete
    if room["questions_in_round"] >= room["questions_per_round"]:
        # Round complete - show round summary
        await broadcast(code, "roundComplete", {
            "round": room["current_round"],
            "maxRounds": room["max_rounds"],
            "message": get_text(lang, "round_complete", round=room["current_round"]),
            "scores": {p["name"]: p["score"] for p in room["players"].values()},
            "activePlayers": [p["name"] for uid, p in room["players"].items() if p.get("active", True)],
            "teamScores": room.get("teams") if room["game_mode"] == "team" else None
        })
        
        await asyncio.sleep(3)
        
        # Eliminate lowest player/team (if not final round)
        if room["current_round"] < room["max_rounds"]:
            if room["game_mode"] == "team":
                game_ended = await eliminate_lowest_team(code)
            else:
                game_ended = await eliminate_lowest_player(code)
            
            if game_ended:
                return
            await asyncio.sleep(3)
        
        # Start next round
        await start_next_round(code)
    else:
        # Continue with next question
        await start_question(code)
        
