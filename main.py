# Resume du fichier :
# Ce fichier est le serveur du jeu Trivia.
# Il sert les pages HTML, donne les questions, cree les salles multijoueur, gere les WebSockets et calcule les scores.
# Les fichiers JavaScript s'occupent de l'interface; ce fichier garde surtout les regles et la communication serveur.

import uuid, random, json, asyncio, time, os, re
try:
    import httpx
except ImportError:
    httpx = None
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List

# === CONFIGURATION DES SCORES ===
# Reglages principaux du score. Ces valeurs influencent tous les modes serveur.
WRONG_ANSWER_PENALTY = 50     # Points perdus pour une mauvaise reponse
TIMEOUT_PENALTY = 50          # Points perdus quand le temps est ecoule
MIN_CORRECT_POINTS = 10       # Minimum de points pour une bonne reponse lente
MAX_CORRECT_POINTS = 100      # Maximum de points pour une reponse instantanee

# === CONFIGURATION DU MODE MISE ===
WAGER_TIME = 15               # Secondes donnees aux joueurs pour miser
WAGER_START_POINTS = 100      # Points de depart de chaque joueur
WAGER_BASE = 50               # Points de base pour chaque bonne reponse
WAGER_WIN_MULTIPLIER = 2      # Une bonne reponse ajoute aussi ce multiplicateur de la mise

# Donne plus de points quand le joueur repond vite.
def calculate_time_score(time_left: float, max_time: float) -> int:
    """Calcule le score selon le temps restant"""
    if max_time <= 0:
        return MIN_CORRECT_POINTS
    time_ratio = max(0, min(1, time_left / max_time))
    score = int(MIN_CORRECT_POINTS + (MAX_CORRECT_POINTS - MIN_CORRECT_POINTS) * time_ratio)
    return score

# NOTE : la difficulte adaptative est seulement en solo et se trouve cote navigateur.
# Multiplayer uses fixed timing and flat scoring — there is no server-side
# cote serveur ni de difficulte collective par salle.

# Charge les variables du fichier .env en developpement local
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded .env file")
except ImportError:
    print("python-dotenv not installed, using system environment variables")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# === CONFIGURATION HUGGING FACE ===
# Le token vient des variables d environnement : ne jamais l ecrire directement dans le code.
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
HF_API_URL = "https://router.huggingface.co/v1/chat/completions"
HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct"

# Avertissement si le token manque
if not HF_API_TOKEN:
    print("WARNING: HF_API_TOKEN environment variable is not set!")
    print("   AI-generated questions will not work.")
    print("   Set it with: export HF_API_TOKEN='your_token_here'")

# Chemin du fichier de cache
CACHE_FILE = "ai_questions_cache.json"

# Cache des questions generees par IA
ai_questions_cache: Dict[str, List[Dict]] = {}

# Charge le cache au demarrage
def load_cache_from_file():
    global ai_questions_cache
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                ai_questions_cache = json.load(f)
                total_questions = sum(len(q) for q in ai_questions_cache.values())
                print(f"Loaded {total_questions} cached questions from {len(ai_questions_cache)} categories")
    except Exception as e:
        print(f"Could not load cache: {e}")
        ai_questions_cache = {}

# Sauvegarde le cache dans le fichier
def save_cache_to_file():
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(ai_questions_cache, f, ensure_ascii=False, indent=2)
        print(f"Cache saved: {sum(len(q) for q in ai_questions_cache.values())} questions")
    except Exception as e:
        print(f"Could not save cache: {e}")

# Charge le cache au lancement
load_cache_from_file()

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
        "team_blue": "Blue Team",
        "player_reconnected": "{player} reconnected!",
        "reconnect_expired": "Reconnection window expired",
        "rematch_starting": "Rematch starting! Returning to lobby...",
        "room_full": "Room is full"
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
        "team_blue": "Équipe Bleue",
        "player_reconnected": "{player} s'est reconnecté !",
        "reconnect_expired": "Délai de reconnexion expiré",
        "rematch_starting": "Revanche ! Retour au lobby...",
        "room_full": "La salle est pleine"
    }
}

# Petits messages serveur traduits en francais/anglais.
def get_text(lang: str, key: str, **kwargs) -> str:
    text = TRANSLATIONS.get(lang, TRANSLATIONS["en"]).get(key, key)
    if kwargs:
        text = text.format(**kwargs)
    return text

# === CHARGEMENT DES QUESTIONS ===
try:
    with open("questions.json", "r", encoding="utf-8") as f:
        ALL_QUESTIONS = json.load(f)
except FileNotFoundError:
    raise RuntimeError("questions.json not found")

# Charge les questions de drapeaux et les ajoute a ALL_QUESTIONS
try:
    with open("flag_questions.json", "r", encoding="utf-8") as f:
        FLAG_QUESTIONS = json.load(f)
    # Ajoute les questions de drapeaux a ALL_QUESTIONS
    for lang in FLAG_QUESTIONS:
        if lang not in ALL_QUESTIONS:
            ALL_QUESTIONS[lang] = {}
        ALL_QUESTIONS[lang]["flags"] = FLAG_QUESTIONS[lang]["flags"]
    print(f"Loaded {len(FLAG_QUESTIONS.get('en', {}).get('flags', []))} flag questions")
except FileNotFoundError:
    print("flag_questions.json not found, flag quiz disabled")
except Exception as e:
    print(f"Error loading flag questions: {e}")

# Load image riddles and replace text riddles
try:
    with open("image_riddles.json", "r", encoding="utf-8") as f:
        IMAGE_RIDDLES = json.load(f)
    # Remplace les enigmes texte par les enigmes image dans ALL_QUESTIONS
    for lang in IMAGE_RIDDLES:
        if lang not in ALL_QUESTIONS:
            ALL_QUESTIONS[lang] = {}
        # Remove old text riddles if they exist
        if "riddles" in ALL_QUESTIONS.get(lang, {}):
            del ALL_QUESTIONS[lang]["riddles"]
        # Add image riddles as the new riddles category
        ALL_QUESTIONS[lang]["image_riddles"] = IMAGE_RIDDLES[lang]["image_riddles"]
    print(f"Loaded {len(IMAGE_RIDDLES.get('en', {}).get('image_riddles', []))} image riddles")
except FileNotFoundError:
    print("image_riddles.json not found, keeping text riddles")
except Exception as e:
    print(f"Error loading image riddles: {e}")

# Charge les questions Picguess
try:
    with open("picguess_questions.json", "r", encoding="utf-8") as f:
        PICGUESS_QUESTIONS = json.load(f)
    for lang in PICGUESS_QUESTIONS:
        if lang not in ALL_QUESTIONS:
            ALL_QUESTIONS[lang] = {}
        ALL_QUESTIONS[lang]["picguess"] = PICGUESS_QUESTIONS[lang]["picguess"]
    print(f"Loaded {len(PICGUESS_QUESTIONS.get('en', {}).get('picguess', []))} picture guess questions")
except FileNotFoundError:
    print("picguess_questions.json not found, picture guess disabled")
except Exception as e:
    print(f"Error loading picture guess questions: {e}")

# === GLOBAL STATE ===
rooms: Dict[str, Dict] = {}
connections: Dict[str, Dict[str, WebSocket]] = {}
room_locks: Dict[str, asyncio.Lock] = {}
disconnected_players: Dict[str, Dict[str, Dict]] = {}  # code -> {user_id -> {player_data, disconnected_at, match_token}}

RECONNECT_WINDOW = 60  # secondes pendant lesquelles un joueur peut se reconnecter
# === OUTILS INTERNES ===
def get_room(code: str) -> Optional[Dict]:
    return rooms.get(code)

def get_public_rooms() -> List[Dict]:
    """Get list of public rooms that are waiting for players"""
    public_rooms = []
    for code, room in rooms.items():
        if room.get("is_public", False) and room.get("state") == "waiting" and room.get("host") in room.get("players", {}):
            connected_count = sum(1 for p in room["players"].values() if p.get("connected", True))
            public_rooms.append({
                "code": code,
                "hostName": room["players"][room["host"]]["name"],
                "playerCount": connected_count,
                "gameMode": room.get("game_mode", "ffa"),
                "state": room.get("state", "waiting"),
                "maxPlayers": 4,
                "updatedAt": time.time()
            })
    return public_rooms

async def broadcast_public_rooms():
    """Broadcast updated public rooms list to all clients in the lobby"""
    public_rooms = get_public_rooms()
    # Envoie a toutes les connexions qui attendent dans le lobby general (code = "LOBBY")
    for user_id, ws in connections.get("LOBBY", {}).items():
        try:
            await ws.send_json({"event": "publicRooms", "data": public_rooms})
        except Exception as e:
            print(f"Error broadcasting public rooms to {user_id}: {e}")

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
    was_public = rooms.get(code, {}).get("is_public", False)
    rooms.pop(code, None)
    connections.pop(code, None)
    room_locks.pop(code, None)
    disconnected_players.pop(code, None)
    # Previent le lobby si c etait une salle publique
    if was_public:
        await broadcast_public_rooms()

def purge_expired_disconnects(code: str):
    """Remove expired disconnection entries for a room"""
    if code not in disconnected_players:
        return
    now = time.time()
    expired = [uid for uid, data in disconnected_players[code].items()
               if now - data["disconnected_at"] > RECONNECT_WINDOW]
    for uid in expired:
        disconnected_players[code].pop(uid, None)
    if not disconnected_players[code]:
        disconnected_players.pop(code, None)

async def end_game(code: str):
    """Mark room as gameOver but keep it alive for rematch"""
    room = get_room(code)
    if room:
        room["state"] = "gameOver"
        # Schedule auto-cleanup after 5 minutes if no rematch
        asyncio.create_task(_auto_cleanup_gameover(code))

async def _auto_cleanup_gameover(code: str):
    """Clean up a gameOver room after 5 minutes if no rematch happened"""
    await asyncio.sleep(300)  # 5 minutes
    room = get_room(code)
    if room and room.get("state") == "gameOver":
        await cleanup_room(code)

def reset_room_for_rematch(code: str):
    """Reset room state for a rematch — keeps players, resets scores and game state"""
    room = get_room(code)
    if not room:
        return False
    
    # Remet les scores a zero et rend les joueurs actifs
    for uid, player in room["players"].items():
        player["score"] = 0
        player["active"] = True
    
    # Remet les scores des equipes a zero si besoin
    if room["teams"]:
        for team_name in room["teams"]:
            room["teams"][team_name]["score"] = 0
            room["teams"][team_name]["active"] = True
    
    # Remet l etat de partie a zero
    room["state"] = "waiting"
    room["current_q"] = None
    room["timer"] = 0
    room["buzzed"] = None
    room["answered"] = False
    room["available"] = []
    room["current_round"] = 1
    room["questions_in_round"] = 0
    
    # Vide la liste des joueurs deconnectes pour cette salle
    disconnected_players.pop(code, None)
    
    return True

# Chrono classique : si personne ne repond a temps, le serveur termine la question.
async def timer_task(code: str):
    room = get_room(code)
    if not room:
        return
    if room.get("quiz_type") == "speed":
        return
    
    start_time = time.time()
    duration = room["timer"]
    
    while time.time() - start_time < duration:
        if room["answered"] or code not in rooms:
            return
        await asyncio.sleep(0.1)
    
    # Temps ecoule : gere le cas avec buzzer et sans buzzer
    if not room["answered"]:
        lock = room_locks.get(code)
        if not lock:
            return
        async with lock:
            if not room["answered"]:
                room["answered"] = True
                q = room["current_q"]
                lang = room.get("language", "en")
                
                # Si quelqu un a buzze sans repondre a temps, applique une penalite
                if room["buzzed"]:
                    buzzed_player = room["players"].get(room["buzzed"])
                    if buzzed_player:
                        buzzed_player["score"] -= TIMEOUT_PENALTY  # Les scores negatifs sont autorises
                        # Deduct from team if team mode
                        if room["game_mode"] == "team" and buzzed_player.get("team"):
                            room["teams"][buzzed_player["team"]]["score"] -= TIMEOUT_PENALTY
                
                await broadcast(code, "answerResult", {
                    "correct": False,
                    "answer": q["options"][q["correct"]],
                    "scores": {p["name"]: p["score"] for p in room["players"].values()},
                    "timeout": True,
                    "message": get_text(lang, "timeout"),
                    "teamScores": room.get("teams") if room["game_mode"] == "team" else None,
                    "pointsEarned": -TIMEOUT_PENALTY if room["buzzed"] else 0
                })
                
                await asyncio.sleep(3)
                await next_question(code)

async def eliminate_lowest_player(code: str):
    """Eliminate the player with the lowest score"""
    room = get_room(code)
    if not room:
        return False
    
    lang = room.get("language", "en")
    
    # Garde seulement les joueurs actifs
    active_players = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
    
    if len(active_players) <= 1:
        # Un seul joueur reste : il gagne et la partie se termine
        winner = list(active_players.values())[0] if active_players else None
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": winner["name"] if winner else None,
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
        })
        await end_game(code)
        return True  # Signal that game ended
    
    # Trouve le joueur avec le score le plus bas
    lowest_player_id = min(active_players.keys(), key=lambda uid: active_players[uid]["score"])
    lowest_player = room["players"][lowest_player_id]
    
    # Marque le joueur comme elimine
    lowest_player["active"] = False
    
    # Annonce l elimination aux joueurs
    await broadcast(code, "playerEliminated", {
        "player": lowest_player["name"],
        "score": lowest_player["score"],
        "message": get_text(lang, "player_eliminated", player=lowest_player["name"]),
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "activePlayers": [p["name"] for uid, p in room["players"].items() if p.get("active", True)]
    })
    
    # Rev?rifie la situation apres elimination
    remaining_active = {uid: p for uid, p in room["players"].items() if p.get("active", True)}
    if len(remaining_active) == 1:
        # Un seul joueur reste apres elimination : fin de partie
        winner = list(remaining_active.values())[0]
        await asyncio.sleep(3)  # Brief pause after elimination message
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": winner["name"],
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()}
        })
        await end_game(code)
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
        # Une seule equipe reste
        winner_team = list(active_teams.keys())[0] if active_teams else None
        team_name = get_text(lang, f"team_{winner_team}")
        
        await broadcast(code, "gameOver", {
            "reason": get_text(lang, "all_questions_completed"),
            "winner": team_name,
            "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
            "teamScores": teams
        })
        await end_game(code)
        return True
    
    # Trouve l equipe avec le score le plus bas
    lowest_team = min(active_teams.keys(), key=lambda t: active_teams[t]["score"])
    teams[lowest_team]["active"] = False
    
    # Elimine tous les joueurs de cette equipe
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
    
    # Verifie s il ne reste qu une equipe
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
        await end_game(code)
        return True
    
    return False

async def start_next_round(code: str):
    """Start the next round"""
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    
    # Verifie s il ne reste qu un joueur ou une equipe
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
            await end_game(code)
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
            await end_game(code)
            return
    
    # Increment round
    room["current_round"] += 1
    room["questions_in_round"] = 0
    
    if room["current_round"] > room["max_rounds"]:
        # Fin de partie : cherche le gagnant
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
        await end_game(code)
        return
    
    # Affiche la transition de manche
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
# Routes HTTP simples : elles servent la page et quelques donnees au navigateur.
@app.get("/")
async def landing(request: Request):
    return templates.TemplateResponse("landing.html", {"request": request})

@app.get("/game")
async def game(request: Request):
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

@app.get("/api/public-rooms")
async def get_public_rooms_api():
    """API endpoint to get list of public rooms"""
    return {"rooms": get_public_rooms()}

# === WEBSOCKET ===
# Connexion temps reel d une salle : creation, rejoindre, buzzer, reponses, langue, rematch.
@app.websocket("/ws/{code}")
async def websocket_endpoint(ws: WebSocket, code: str):
    await ws.accept()
    code = code.upper()[:6]
    user_id = None
    
    try:
        while True:
            try:
                msg = await ws.receive_json()
            except (WebSocketDisconnect, RuntimeError):
                break
            action = msg.get("action")

            # === ACTIONS DU LOBBY ===
            if action == "joinLobby":
                # Rejoint le lobby pour recevoir les mises a jour des salles publiques
                user_id = str(uuid.uuid4())
                if "LOBBY" not in connections:
                    connections["LOBBY"] = {}
                connections["LOBBY"][user_id] = ws
                
                # Envoie les salles publiques actuelles
                await ws.send_json({"event": "publicRooms", "data": get_public_rooms()})

            elif action == "leaveLobby":
                # Quitte le lobby
                if user_id and "LOBBY" in connections:
                    connections["LOBBY"].pop(user_id, None)

            elif action == "create":
                # Retire du lobby si la connexion y etait
                if user_id and "LOBBY" in connections:
                    connections["LOBBY"].pop(user_id, None)
                
                if code in rooms:
                    lang = msg.get("language", "en")
                    await ws.send_json({"event": "error", "data": get_text(lang, "room_exists")})
                    continue
                
                language = msg.get("language", "en")
                subjects = msg.get("subjects", [])
                game_mode = msg.get("gameMode", "ffa")
                is_public = msg.get("isPublic", False)  # Option salle publique
                ai_questions = msg.get("aiQuestions", None)  # NOUVEAU : questions generees par IA
                quiz_type = msg.get("quizType", "classic")  # NOUVEAU : classic, truefalse, picguess, speed
                
                # Logs de debug
                print(f"Creating room {code}")
                print(f"AI Questions received: {ai_questions is not None}")
                print(f"Quiz type: {quiz_type}")
                if ai_questions:
                    print(f"Number of AI questions: {len(ai_questions)}")
                
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
                    "max_rounds": 1 if quiz_type == "speed" else 3,
                    "questions_per_round": 10 if quiz_type == "speed" else 5,
                    "game_mode": game_mode,
                    "is_public": is_public,  # NEW: Store public status
                    "ai_questions": ai_questions,  # NOUVEAU : garde les questions IA
                    "quiz_type": quiz_type,  # NEW: Store quiz type
                    "teams": {"red": {"score": 0, "active": True}, "blue": {"score": 0, "active": True}} if game_mode == "team" else None,
                }
                connections[code] = {}
                room_locks[code] = asyncio.Lock()
                
                await ws.send_json({"event": "roomCreated", "data": {"code": code, "language": language, "gameMode": game_mode, "isPublic": is_public}})
                
                # La salle publique sera publiee apres l'arrivee de l'hote,
                # pour eviter d'afficher une carte temporaire "0/4".

            
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
                # Retire du lobby si la connexion y etait
                if user_id and "LOBBY" in connections:
                    connections["LOBBY"].pop(user_id, None)
                
                room = get_room(code)
                if not room:
                    lang = msg.get("language", "en")
                    await ws.send_json({"event": "error", "data": get_text(lang, "room_not_found")})
                    continue

                lang = room.get("language", "en")
                name = msg.get("playerName", "").strip()
                selected_team = msg.get("team")
                avatar_config = msg.get("avatar")  # Recupere l avatar du client
                
                # Verifie la limite de 4 joueurs
                MAX_PLAYERS = 4
                if len(room["players"]) >= MAX_PLAYERS:
                    await ws.send_json({"event": "error", "data": get_text(lang, "room_full")})
                    continue
                
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
                         # Verifie si l equipe est pleine (2 joueurs max)
                         team_count = sum(1 for p in room["players"].values() if p.get("team") == selected_team)
                         if team_count >= 2:
                          await ws.send_json({"event": "error", "data": get_text(lang, "team_full")})
                          continue
                         team = selected_team
                   else:
                         # Assigne automatiquement a l equipe avec moins de joueurs
                         red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                         blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                         team = "red" if red_count <= blue_count else "blue"

                room["players"][user_id] = {
                    "name": name,
                    "match_token": match_token,
                    "score": 0,
                    "joined_at": time.time(),
                    "active": True,
                    "connected": True,
                    "team": team,
                    "avatar": avatar_config,
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

                # Verifie si la partie peut demarrer : 2-4 en FFA, exactement 4 en equipe
                can_start = False
                if room["game_mode"] == "team":
                    red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                    blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    can_start = len(room["players"]) == 4 and red_count == 2 and blue_count == 2
                else:
                    can_start = len(room["players"]) >= 2 and len(room["players"]) <= MAX_PLAYERS

                await broadcast(code, "players", {
                    "players": [
                        {
                            "name": p["name"], 
                            "score": p["score"],
                            "isHost": uid == room["host"],
                            "team": p.get("team"),
                            "avatar": p.get("avatar")  # Inclut l avatar dans l envoi aux joueurs
                        }
                        for uid, p in room["players"].items()
                    ],
                    "count": len(room["players"]),
                    "maxPlayers": MAX_PLAYERS,
                    "canStart": can_start,
                    "gameMode": room["game_mode"],
                    "teamCounts": {
                        "red": sum(1 for p in room["players"].values() if p.get("team") == "red"),
                        "blue": sum(1 for p in room["players"].values() if p.get("team") == "blue")
                }   if room["game_mode"] == "team" else None
                     })
                
                # Informe le lobby du nouveau nombre de joueurs
                if room.get("is_public"):
                    await broadcast_public_rooms()

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
                
                # Verifie le nombre de joueurs selon le mode
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

                # Mode Mise : tout le monde commence avec la meme petite banque de points.
                if room.get("quiz_type") == "wager":
                    for p in room["players"].values():
                        p["score"] = WAGER_START_POINTS
                    if room["game_mode"] == "team" and room.get("teams"):
                        for tname, team in room["teams"].items():
                            team["score"] = sum(p["score"] for p in room["players"].values() if p.get("team") == tname)

                room["state"] = "question"
                
                # Retire la salle des salles publiques quand la partie commence
                if room.get("is_public"):
                    await broadcast_public_rooms()
                
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

            elif action == "reaction":
                # Gere les reactions des joueurs pendant la partie
                room = get_room(code)
                if not room:
                    continue
                
                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                emoji = msg.get("emoji", "")

                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    continue
                
                # Envoie la reaction a tous sauf a l envoyeur
                for uid, p in room["players"].items():
                    if uid != msg_user_id and uid in connections.get(code, {}):
                        try:
                            await connections[code][uid].send_json({
                                "event": "reaction",
                                "data": {
                                    "player": player["name"],
                                    "emoji": emoji
                                }
                            })
                        except:
                            pass

            elif action == "changeLanguage":
                room = get_room(code)
                if not room:
                    continue

                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                requested_lang = msg.get("language", "fr")
                current_lang = room.get("language", "en")

                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    await ws.send_json({"event": "error", "data": get_text(current_lang, "invalid_credentials")})
                    continue

                if msg_user_id != room["host"]:
                    await ws.send_json({"event": "error", "data": get_text(current_lang, "only_host_start")})
                    continue

                if requested_lang not in TRANSLATIONS:
                    requested_lang = "fr"

                room["language"] = requested_lang
                await broadcast(code, "languageChanged", {
                    "language": requested_lang,
                    "changedBy": player["name"]
                })

            elif action == "rejoin":
                # Reconnection — player reconnects with stored credentials
                rejoin_token = msg.get("matchToken")
                rejoin_user_id = msg.get("userId")
                
                room = get_room(code)
                if not room:
                    await ws.send_json({"event": "error", "data": "Room no longer exists"})
                    continue
                
                lang = room.get("language", "en")
                
                # Verifie si ce joueur est dans la liste des deconnectes
                purge_expired_disconnects(code)
                disc_entry = disconnected_players.get(code, {}).get(rejoin_user_id)
                
                if not disc_entry or disc_entry["match_token"] != rejoin_token:
                    # Verifie aussi s il est encore dans la salle mais marque deconnecte
                    player = room["players"].get(rejoin_user_id)
                    if player and player.get("match_token") == rejoin_token and not player.get("connected", True):
                        # Valid — restore connection
                        player["connected"] = True
                        connections[code][rejoin_user_id] = ws
                        user_id = rejoin_user_id
                        
                        # Clean up disconnected entry
                        if code in disconnected_players:
                            disconnected_players[code].pop(rejoin_user_id, None)
                        
                        await ws.send_json({"event": "rejoined", "data": {
                            "userId": rejoin_user_id,
                            "matchToken": rejoin_token,
                            "isHost": rejoin_user_id == room["host"],
                            "team": player.get("team"),
                            "score": player["score"],
                            "gameState": room["state"],
                            "language": lang,
                            "roomCode": code
                        }})
                        
                        await broadcast(code, "playerReconnected", {
                            "player": player["name"],
                            "message": get_text(lang, "player_reconnected", player=player["name"])
                        }, exclude=rejoin_user_id)
                    else:
                        await ws.send_json({"event": "rejoinFailed", "data": get_text(lang, "reconnect_expired")})
                    continue
                
                # Restore from disconnected pool
                player_data = disc_entry["player_data"]
                player_data["connected"] = True
                
                # Le joueur doit encore etre dans room["players"] avec l etat deconnecte
                if rejoin_user_id in room["players"]:
                    room["players"][rejoin_user_id]["connected"] = True
                else:
                    # Edge case: was removed — re-add
                    room["players"][rejoin_user_id] = player_data
                
                connections[code][rejoin_user_id] = ws
                user_id = rejoin_user_id
                
                # Clean up disconnected entry
                disconnected_players[code].pop(rejoin_user_id, None)
                if not disconnected_players[code]:
                    disconnected_players.pop(code, None)
                
                await ws.send_json({"event": "rejoined", "data": {
                    "userId": rejoin_user_id,
                    "matchToken": rejoin_token,
                    "isHost": rejoin_user_id == room["host"],
                    "team": player_data.get("team"),
                    "score": player_data["score"],
                    "gameState": room["state"],
                    "language": lang,
                    "roomCode": code
                }})
                
                await broadcast(code, "playerReconnected", {
                    "player": player_data["name"],
                    "message": get_text(lang, "player_reconnected", player=player_data["name"])
                }, exclude=rejoin_user_id)

            elif action == "rematch":
                # Post-game rematch — host resets room, everyone returns to lobby
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
                
                # Autorise la revanche seulement depuis la fin de partie ou l attente
                if room["state"] not in ["waiting", "gameOver"]:
                    # Autorise aussi si la partie vient juste de finir
                    pass
                
                # Remet la salle a zero
                if not reset_room_for_rematch(code):
                    await ws.send_json({"event": "error", "data": "Could not reset room"})
                    continue
                
                # Determine can_start
                MAX_PLAYERS = 4
                can_start = False
                if room["game_mode"] == "team":
                    red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                    blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    can_start = len(room["players"]) == 4 and red_count == 2 and blue_count == 2
                else:
                    can_start = len(room["players"]) >= 2 and len(room["players"]) <= MAX_PLAYERS
                
                # Annonce la revanche a tous les joueurs
                await broadcast(code, "rematchStarted", {
                    "message": get_text(lang, "rematch_starting"),
                    "roomCode": code,
                    "players": [
                        {
                            "name": p["name"],
                            "score": p["score"],
                            "isHost": uid == room["host"],
                            "team": p.get("team"),
                            "avatar": p.get("avatar")
                        }
                        for uid, p in room["players"].items()
                    ],
                    "count": len(room["players"]),
                    "maxPlayers": MAX_PLAYERS,
                    "canStart": can_start,
                    "gameMode": room["game_mode"],
                    "teamCounts": {
                        "red": sum(1 for p in room["players"].values() if p.get("team") == "red"),
                        "blue": sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    } if room["game_mode"] == "team" else None
                })
                
                # Republie la salle dans le lobby si elle est publique
                if room.get("is_public"):
                    await broadcast_public_rooms()

            elif action == "wager":
                room = get_room(code)
                if not room:
                    continue
                if room.get("quiz_type") != "wager" or room.get("state") != "wagering":
                    continue

                msg_user_id = msg.get("userId")
                token = msg.get("matchToken")
                player = room["players"].get(msg_user_id)
                if not player or player["match_token"] != token:
                    continue
                if not player.get("active", True):
                    continue

                amount = msg.get("amount", 0)
                if not isinstance(amount, (int, float)):
                    continue
                amount = max(0, min(int(amount), max_wager_for(player)))

                async with room_locks[code]:
                    if room.get("state") != "wagering":
                        continue
                    room.setdefault("wagers", {})[msg_user_id] = amount
                    await send_to_user(code, msg_user_id, "wagerAccepted", {"amount": amount})
                    ids = active_connected_ids(room)
                    if ids and all(uid in room["wagers"] for uid in ids):
                        await begin_wager_answers(code)

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

                # MODE MISE : chaque joueur actif repond en meme temps, sans buzzer.
                if room.get("quiz_type") == "wager":
                    if room.get("state") != "wager_answer":
                        continue
                    async with room_locks[code]:
                        if room.get("state") != "wager_answer":
                            continue
                        q = room["current_q"]
                        if not (0 <= idx < len(q["options"])):
                            continue
                        if msg_user_id in room.get("wager_answers", {}):
                            continue
                        room.setdefault("wager_answers", {})[msg_user_id] = idx
                        await send_to_user(code, msg_user_id, "answerLocked", {"idx": idx})
                        ids = active_connected_ids(room)
                        if ids and all(uid in room["wager_answers"] for uid in ids):
                            await resolve_wager(code)
                    continue

                # MODE SPEED : une manche rapide ou tout le monde repond en meme temps.
                if room.get("quiz_type") == "speed":
                    if room.get("state") != "speed_answer":
                        continue
                    async with room_locks[code]:
                        if room.get("state") != "speed_answer":
                            continue
                        q = room["current_q"]
                        if not (0 <= idx < len(q["options"])):
                            continue
                        if msg_user_id in room.get("speed_answers", {}):
                            continue
                        room.setdefault("speed_answers", {})[msg_user_id] = {
                            "idx": idx,
                            "answered_at": time.time(),
                        }
                        await send_to_user(code, msg_user_id, "answerLocked", {"idx": idx})
                        ids = active_connected_ids(room)
                        if ids and all(uid in room["speed_answers"] for uid in ids):
                            await resolve_speed(code)
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
                    points_earned = 0

                    if correct:
                        # Score base sur le temps, sans multiplicateur adaptatif en multijoueur
                        elapsed = time.time() - room.get("question_start_time", time.time())
                        time_left = max(0, room.get("max_time", 10) - elapsed)
                        points_earned = calculate_time_score(time_left, room.get("max_time", 10))
                        player["score"] += points_earned
                        # Add score to team if team mode
                        if room["game_mode"] == "team" and player.get("team"):
                            room["teams"][player["team"]]["score"] += points_earned
                    else:
                        # Penalite de mauvaise reponse, les scores negatifs sont possibles
                        points_earned = -WRONG_ANSWER_PENALTY
                        player["score"] -= WRONG_ANSWER_PENALTY
                        # Deduct from team if team mode - allow negative
                        if room["game_mode"] == "team" and player.get("team"):
                            room["teams"][player["team"]]["score"] -= WRONG_ANSWER_PENALTY

                    correct_answer = q["options"][q["correct"]]
                    message = get_text(lang, "correct") if correct else get_text(lang, "wrong", answer=correct_answer)

                    await broadcast(code, "answerResult", {
                        "correct": correct,
                        "answer": correct_answer,
                        "answeredBy": player["name"],
                        "message": message,
                        "scores": {p["name"]: p["score"] for p in room["players"].values()},
                        "teamScores": room.get("teams") if room["game_mode"] == "team" else None,
                        "selectedIdx": idx,
                        "pointsEarned": points_earned,
                    })

                    await asyncio.sleep(3)
                    await next_question(code)

    except WebSocketDisconnect:
        pass
    finally:
        # Nettoie la connexion au lobby
        if user_id and "LOBBY" in connections:
            connections["LOBBY"].pop(user_id, None)
        
        if code in connections and user_id in connections[code]:
            connections[code].pop(user_id, None)
        
        room = get_room(code)
        if room and user_id in room["players"]:
            player_name = room["players"][user_id]["name"]
            was_host = (user_id == room["host"])
            lang = room.get("language", "en")
            game_state = room.get("state", "waiting")
            
            # Si la partie est en cours, garde le joueur pour une reconnexion au lieu de le retirer
            if game_state in ["question", "buzzed", "answered", "speed_answer", "speed_done", "wagering", "wager_answer", "wager_done"]:
                player_data = room["players"][user_id].copy()
                if code not in disconnected_players:
                    disconnected_players[code] = {}
                disconnected_players[code][user_id] = {
                    "player_data": player_data,
                    "disconnected_at": time.time(),
                    "match_token": player_data["match_token"]
                }
                # Marque comme deconnecte sans retirer tout de suite
                room["players"][user_id]["connected"] = False
                
                await broadcast(code, "playerDisconnected", {
                    "player": player_name,
                    "message": f"{player_name} disconnected — waiting for reconnection...",
                    "timeout": RECONNECT_WINDOW
                }, exclude=user_id)
                
                # Schedule cleanup after RECONNECT_WINDOW
                asyncio.create_task(_delayed_disconnect_cleanup(code, user_id, player_name, was_host))
            else:
                # Not in game — remove immediately (lobby/waiting/gameOver)
                room["players"].pop(user_id)
                
                if was_host and room["players"]:
                    new_host = next(iter(room["players"].keys()))
                    room["host"] = new_host
                    await broadcast(code, "newHost", {
                        "hostName": room["players"][new_host]["name"],
                        "message": get_text(lang, "new_host", host=room["players"][new_host]["name"])
                    })
                
                MAX_PLAYERS = 4
                can_start = False
                if room["game_mode"] == "team":
                    red_count = sum(1 for p in room["players"].values() if p.get("team") == "red")
                    blue_count = sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    can_start = len(room["players"]) == 4 and red_count == 2 and blue_count == 2
                else:
                    can_start = len(room["players"]) >= 2 and len(room["players"]) <= MAX_PLAYERS
                
                await broadcast(code, "playerLeft", {
                    "player": player_name,
                    "remaining": len(room["players"]),
                    "message": get_text(lang, "player_left", player=player_name)
                })
                
                await broadcast(code, "players", {
                    "players": [
                        {
                            "name": p["name"], 
                            "score": p["score"],
                            "isHost": uid == room["host"],
                            "team": p.get("team"),
                            "avatar": p.get("avatar")
                        }
                        for uid, p in room["players"].items()
                    ],
                    "count": len(room["players"]),
                    "maxPlayers": MAX_PLAYERS,
                    "canStart": can_start,
                    "gameMode": room["game_mode"],
                    "teamCounts": {
                        "red": sum(1 for p in room["players"].values() if p.get("team") == "red"),
                        "blue": sum(1 for p in room["players"].values() if p.get("team") == "blue")
                    } if room["game_mode"] == "team" else None
                })
                
                if room.get("is_public"):
                    await broadcast_public_rooms()
                
                if len(room["players"]) == 0:
                    await cleanup_room(code)


async def _delayed_disconnect_cleanup(code: str, user_id: str, player_name: str, was_host: bool):
    """After RECONNECT_WINDOW seconds, if the player hasn't reconnected, remove them for real"""
    await asyncio.sleep(RECONNECT_WINDOW)
    
    room = get_room(code)
    if not room:
        return
    
    # Verifie si le joueur s est deja reconnecte
    player = room["players"].get(user_id)
    if not player:
        return  # Deja retire
    if player.get("connected", True):
        return  # Reconnected successfully
    
    # Player didn't reconnect — remove them now
    lang = room.get("language", "en")
    game_state = room.get("state", "waiting")
    room["players"].pop(user_id, None)
    
    # Nettoie l entree dans disconnected_players
    if code in disconnected_players:
        disconnected_players[code].pop(user_id, None)
    
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
    
    # Termine la partie s il ne reste pas assez de joueurs
    if game_state in ["question", "buzzed", "answered", "speed_answer", "speed_done"]:
        connected_players = {uid: p for uid, p in room["players"].items() if p.get("connected", True)}
        min_players = 4 if room.get("game_mode") == "team" else 2
        if len(connected_players) < min_players:
            await broadcast(code, "gameOver", {
                "reason": get_text(lang, "not_enough_players"),
                "winner": None,
                "finalScores": {p["name"]: p["score"] for p in room["players"].values()},
                "teamScores": room.get("teams") if room.get("game_mode") == "team" else None
            })
            await cleanup_room(code)
    elif len(room["players"]) == 0:
        await cleanup_room(code)

# === LOGIQUE DE PARTIE ===

# === DEROULE DU MODE MISE (sans buzzer : miser puis repondre) ===
def max_wager_for(player) -> int:
    """A player may wager up to the points they currently hold (their bankroll)."""
    return max(0, int(player.get("score", 0)))

def pop_question_by_difficulty(available, target):
    """Pop a question matching the target difficulty (1/2/3); fall back to the closest."""
    if not available:
        return None
    exact = [i for i, q in enumerate(available) if q.get("difficulty") == target]
    if exact:
        return available.pop(random.choice(exact))
    # Difficulte la plus proche (sans tag = moyen)
    best = min(range(len(available)), key=lambda i: abs(available[i].get("difficulty", 2) - target))
    return available.pop(best)

# Liste les joueurs encore actifs et connectes dans une salle.
def active_connected_ids(room) -> List[str]:
    return [uid for uid, p in room["players"].items()
            if p.get("active", True) and p.get("connected", True)]

# Mode Mise, etape 1 : chaque joueur choisit combien de points il risque.
async def start_wager_collection(code: str):
    """Stake phase: buzzer off, players secretly wager before the question is shown."""
    room = get_room(code)
    if not room:
        return
    room["state"] = "wagering"
    room["wagers"] = {}
    room["wager_answers"] = {}
    await broadcast(code, "wagerPhase", {
        "round": room["current_round"],
        "questionInRound": room["questions_in_round"],
        "questionsPerRound": room["questions_per_round"],
        "wagerTime": WAGER_TIME,
        "difficulty": room.get("wager_difficulty", 1),
        "winMultiplier": WAGER_WIN_MULTIPLIER,
        "base": WAGER_BASE,
        "maxWagers": {p["name"]: max_wager_for(p)
                      for p in room["players"].values() if p.get("active", True)},
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
    })
    asyncio.create_task(wager_collection_timer(code))

async def wager_collection_timer(code: str):
    await asyncio.sleep(WAGER_TIME)
    room = get_room(code)
    if not room or room.get("state") != "wagering":
        return
    lock = room_locks.get(code)
    if not lock:
        return
    async with lock:
        if room.get("state") == "wagering":
            await begin_wager_answers(code)

async def begin_wager_answers(code: str):
    """Reveal the question and open simultaneous answering. Caller must hold the room lock."""
    room = get_room(code)
    if not room or room.get("state") != "wagering":
        return
    room["state"] = "wager_answer"
    room["answered"] = False
    room["question_start_time"] = time.time()
    q = room["current_q"]
    question_data = {
        "q": q["q"],
        "options": q["options"],
        "time": room["timer"],
        "remaining": len(room["available"]),
        "round": room["current_round"],
        "questionInRound": room["questions_in_round"],
        "questionsPerRound": room["questions_per_round"],
        "quizType": "wager",
        "buzzerless": True,
        "difficulty": room.get("wager_difficulty", 1),
    }
    if "image" in q:
        question_data["image"] = q["image"]
    await broadcast(code, "question", question_data)
    asyncio.create_task(wager_answer_timer(code))

async def wager_answer_timer(code: str):
    room = get_room(code)
    if not room:
        return
    duration = room.get("timer", 10)
    start = time.time()
    while time.time() - start < duration:
        r = get_room(code)
        if not r or r.get("state") != "wager_answer":
            return
        await asyncio.sleep(0.2)
    lock = room_locks.get(code)
    if not lock:
        return
    async with lock:
        r = get_room(code)
        if r and r.get("state") == "wager_answer":
            await resolve_wager(code)

# Mode Mise, etape finale : applique les gains ou pertes apres les reponses.
async def resolve_wager(code: str):
    """Score every active player's wager and advance. Caller must hold the room lock."""
    room = get_room(code)
    if not room or room.get("state") == "wager_done":
        return
    room["state"] = "wager_done"
    room["answered"] = True
    q = room["current_q"]
    correct_idx = q["correct"]
    results = {}
    for uid, p in room["players"].items():
        if not p.get("active", True):
            continue
        wager = int(room.get("wagers", {}).get(uid, 0))
        ans = room.get("wager_answers", {}).get(uid, None)
        is_correct = (ans == correct_idx)
        # Correct: base reward + (multiplier × wager). Wrong/timeout: lose the wager.
        # La mise est limitee aux points du joueur, donc elle ne rend pas le score negatif.
        delta = (WAGER_BASE + WAGER_WIN_MULTIPLIER * wager) if is_correct else -wager
        p["score"] += delta
        if room["game_mode"] == "team" and p.get("team"):
            room["teams"][p["team"]]["score"] += delta
        results[p["name"]] = {
            "wager": wager,
            "correct": is_correct,
            "delta": delta,
            "answered": ans is not None,
        }
    await broadcast(code, "wagerResult", {
        "answer": q["options"][correct_idx],
        "correctIdx": correct_idx,
        "results": results,
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "teamScores": room.get("teams") if room["game_mode"] == "team" else None,
    })
    await asyncio.sleep(4)
    await next_question(code)

async def speed_answer_timer(code: str):
    room = get_room(code)
    if not room:
        return
    duration = room.get("timer", 8)
    start = time.time()
    while time.time() - start < duration:
        r = get_room(code)
        if not r or r.get("state") != "speed_answer":
            return
        await asyncio.sleep(0.15)
    lock = room_locks.get(code)
    if not lock:
        return
    async with lock:
        r = get_room(code)
        if r and r.get("state") == "speed_answer":
            await resolve_speed(code)

# Mode Speed : tout le monde repond en meme temps, puis chacun est score selon sa vitesse.
async def resolve_speed(code: str):
    """Score one buzzerless speed question for every active player."""
    room = get_room(code)
    if not room or room.get("state") == "speed_done":
        return
    room["state"] = "speed_done"
    room["answered"] = True

    q = room["current_q"]
    correct_idx = q["correct"]
    max_time = room.get("max_time", 8)
    started_at = room.get("question_start_time", time.time())
    results = {}

    for uid, p in room["players"].items():
        if not p.get("active", True):
            continue
        entry = room.get("speed_answers", {}).get(uid)
        idx = entry.get("idx") if isinstance(entry, dict) else None
        answered = idx is not None
        correct = idx == correct_idx
        delta = 0
        if correct:
            elapsed = max(0, entry.get("answered_at", time.time()) - started_at)
            time_left = max(0, max_time - elapsed)
            delta = calculate_time_score(time_left, max_time)
            p["score"] += delta
            if room["game_mode"] == "team" and p.get("team"):
                room["teams"][p["team"]]["score"] += delta
        elif answered:
            delta = -WRONG_ANSWER_PENALTY
            p["score"] -= WRONG_ANSWER_PENALTY
            if room["game_mode"] == "team" and p.get("team"):
                room["teams"][p["team"]]["score"] -= WRONG_ANSWER_PENALTY

        results[p["name"]] = {
            "answered": answered,
            "correct": correct,
            "selectedIdx": idx,
            "delta": delta,
        }

    await broadcast(code, "speedResult", {
        "answer": q["options"][correct_idx],
        "correctIdx": correct_idx,
        "results": results,
        "scores": {p["name"]: p["score"] for p in room["players"].values()},
        "teamScores": room.get("teams") if room["game_mode"] == "team" else None,
    })
    await asyncio.sleep(2)
    await next_question(code)

 #KANE
# Prepare et envoie la prochaine question selon le type de quiz choisi.
async def start_question(code: str):
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    subjects = room.get("subjects", [])
    ai_questions = room.get("ai_questions", None)
    quiz_type = room.get("quiz_type", "classic")
    
    # Pour Picguess, ajoute les questions Picguess si elles manquent
    if quiz_type == "picguess" and "picguess" not in subjects:
        subjects = subjects + ["picguess"]
    
    # Logs de debug
    print(f"start_question called for room {code}")
    print(f"AI questions in room: {ai_questions is not None}")
    if ai_questions:
        print(f"Number of AI questions: {len(ai_questions)}")
    print(f"Available questions: {len(room['available'])}")

    if not room["available"]:
        # Verifie s il y a des questions IA
        if ai_questions and len(ai_questions) > 0:
            room["available"] = ai_questions.copy()
            random.shuffle(room["available"])
        else:
            # Utilise les questions deja prevues dans questions.json
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
        await end_game(code)
        return

    q = None
    quiz_type = room.get("quiz_type", "classic")

    if quiz_type == "wager":
        # Rising difficulty: round 1 = easy (1), round 2 = medium (2), round 3 = hard (3).
        target_diff = min(room["current_round"], 3)
        room["wager_difficulty"] = target_diff
        q = pop_question_by_difficulty(room["available"], target_diff)
    else:
        # Les autres modes multijoueur prennent une question aleatoire simple.
        q = room["available"].pop()
    room["current_q"] = q

    # Le chrono depend seulement du type de quiz.
    base_time = q.get("time", 10)
    if quiz_type == "speed":
        base_time = max(5, base_time // 2)
    elif quiz_type == "picguess":
        base_time = 15

    room["timer"] = base_time
    room["max_time"] = room["timer"]
    room["question_start_time"] = time.time()
    room["buzzed"] = None
    room["answered"] = False
    room["state"] = "speed_answer" if quiz_type == "speed" else "question"
    room["questions_in_round"] += 1
    if quiz_type == "speed":
        room["speed_answers"] = {}

    # MODE MISE : on collecte les mises avant de montrer la question.
    if quiz_type == "wager":
        await start_wager_collection(code)
        return

    # Construit les donnees de question selon le type de quiz
    question_data = {
        "q": q["q"],
        "time": room["timer"],
        "remaining": len(room["available"]),
        "round": room["current_round"],
        "questionInRound": room["questions_in_round"],
        "questionsPerRound": room["questions_per_round"],
        "quizType": quiz_type,
    }
    if quiz_type == "speed":
        question_data["buzzerless"] = True
        question_data["speed"] = True
    
    if quiz_type == "truefalse":
        # Convertit en Vrai/Faux : la bonne reponse originale est dans q["correct"]
        correct_option = q["options"][q["correct"]]
        tf_options = ["Vrai", "Faux"] if lang == "fr" else ["True", "False"]
        # Une chance sur deux de montrer une affirmation vraie ou fausse
        if random.random() > 0.5:
            question_data["q"] = f"{q['q']} -> {correct_option}"
            question_data["options"] = tf_options
            question_data["tfCorrect"] = 0
        else:
            wrong_options = [o for i, o in enumerate(q["options"]) if i != q["correct"]]
            wrong_answer = random.choice(wrong_options) if wrong_options else correct_option
            question_data["q"] = f"{q['q']} -> {wrong_answer}"
            question_data["options"] = tf_options
            question_data["tfCorrect"] = 1
        # Remplace l index correct pour verifier la reponse
        room["current_q"] = {**q, "options": tf_options, "correct": question_data["tfCorrect"]}
    elif quiz_type == "picguess":
        # Picguess : envoie l image avec les infos de flou
        question_data["options"] = q["options"]
        question_data["picguess"] = True
        question_data["blurStart"] = 20  # Flou de depart en pixels
        question_data["blurEnd"] = 0  # Flou final
        if "image" in q:
            question_data["image"] = q["image"]
    else:
        # Classique et Speed utilisent les options normales
        question_data["options"] = q["options"]
    
    # Include image if present (for flag quiz etc.)
    if "image" in q and "image" not in question_data:
        question_data["image"] = q["image"]
    
    await broadcast(code, "question", question_data)
    
    if quiz_type == "speed":
        asyncio.create_task(speed_answer_timer(code))
    else:
        asyncio.create_task(timer_task(code))
#KANE
# Decide si on passe a la question suivante, a la manche suivante, ou a la fin de partie.
async def next_question(code: str):
    room = get_room(code)
    if not room:
        return
    
    lang = room.get("language", "en")
    
    # Verifie si la manche est terminee
    if room["questions_in_round"] >= room["questions_per_round"]:
        # Manche terminee : affiche le resume
        await broadcast(code, "roundComplete", {
            "round": room["current_round"],
            "maxRounds": room["max_rounds"],
            "message": get_text(lang, "round_complete", round=room["current_round"]),
            "scores": {p["name"]: p["score"] for p in room["players"].values()},
            "activePlayers": [p["name"] for uid, p in room["players"].items() if p.get("active", True)],
            "teamScores": room.get("teams") if room["game_mode"] == "team" else None
        })
        
        await asyncio.sleep(3)
        
        # Elimine le joueur/equipe le plus bas si ce n est pas la derniere manche. En Mise,
        # everyone in for all 3 rounds — the winner is simply the highest score.
        if room.get("quiz_type") != "wager" and room["current_round"] < room["max_rounds"]:
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
        # Passe a la question suivante
        await start_question(code)


# === GENERATION DE QUESTIONS IA ===

# Nombre minimum de questions avant d arreter d en generer
MIN_CACHE_SIZE = 90

async def generate_ai_questions(category: str, num_questions: int = 10, language: str = "fr") -> List[Dict]:
    """Generate trivia questions using Hugging Face API with smart caching"""
    
    cache_key = f"{category.lower().strip()}_{language}"
    
    # Regarde combien de questions sont deja en cache
    cached_count = len(ai_questions_cache.get(cache_key, []))
    
    # LOGIQUE HYBRIDE :
    # Si le cache est assez rempli, renvoie une selection aleatoire
    # Si le cache existe mais est trop petit, genere plus de questions
    # Si le cache est vide, genere de nouvelles questions
    
    if cached_count >= MIN_CACHE_SIZE:
        # Le cache est suffisant : on renvoie une selection aleatoire tout de suite
        print(f"Cache hit for '{category}': {cached_count} questions available")
        return random.sample(ai_questions_cache[cache_key], num_questions)
    
    # Il faut plus de questions : on en genere
    print(f"Generating more questions for '{category}' (current cache: {cached_count})")

    if httpx is None:
        print("httpx is not installed; AI question generation is unavailable.")
        return None
    
    # Genere plus de questions pour remplir la reserve
    questions_to_generate = 15  # Genere 15 questions a la fois pour remplir le cache plus vite
    
    lang_instruction = "en français" if language == "fr" else "in English"
    
    system_prompt = f"""Tu es un générateur de questions de quiz. Tu dois générer exactement {questions_to_generate} questions de trivia.

IMPORTANT: Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après.

Format EXACT requis:
[
  {{
    "question": "La question ici?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "La bonne réponse (doit être identique à une des options)"
  }}
]

Règles:
- Chaque question doit avoir exactement 4 options
- La réponse doit être exactement une des 4 options
- Les questions doivent être variées et intéressantes
- Assure-toi que les faits sont corrects
- NE PAS répéter de questions similaires"""

    user_prompt = f"Génère {questions_to_generate} questions de trivia sur le thème: \"{category}\" {lang_instruction}. Réponds uniquement avec le JSON."

    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 2500,
        "temperature": 0.8
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print(f"Calling HF API for category: {category}")
            response = await client.post(HF_API_URL, headers=headers, json=payload)
            
            print(f"HF API response status: {response.status_code}")
            
            if response.status_code == 503 or response.status_code == 500:
                # Le modele charge : si le cache contient quelque chose, on l utilise
                print(f"Model loading (503/500), cached_count: {cached_count}")
                if cached_count >= num_questions:
                    print(f"Using {cached_count} cached questions")
                    return random.sample(ai_questions_cache[cache_key], num_questions)
                return None
            
            if response.status_code != 200:
                print(f"HF API error: {response.status_code} - {response.text}")
                # Utilise le cache en secours si disponible
                if cached_count >= num_questions:
                    return random.sample(ai_questions_cache[cache_key], num_questions)
                return None
            
            result = response.json()
            print(f"HF API result: {result}")
            
            # Parse chat completions response format
            generated_text = ""
            if isinstance(result, dict):
                # New chat completions format
                if "choices" in result and len(result["choices"]) > 0:
                    generated_text = result["choices"][0].get("message", {}).get("content", "")
                # Secours pour l ancien format
                elif "generated_text" in result:
                    generated_text = result["generated_text"]
            elif isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
            
            if not generated_text:
                generated_text = str(result)
            
            print(f"Generated text length: {len(generated_text)}")
            print(f"Generated text preview: {generated_text[:500]}...")
            
            # Parse JSON from response
            new_questions = parse_ai_response(generated_text)
            
            if new_questions:
                # Initialise le cache de cette categorie si besoin
                if cache_key not in ai_questions_cache:
                    ai_questions_cache[cache_key] = []
                
                # Ajoute les nouvelles questions en evitant les doublons
                existing_questions = {q["question"] for q in ai_questions_cache[cache_key]}
                unique_new = [q for q in new_questions if q["question"] not in existing_questions]
                
                ai_questions_cache[cache_key].extend(unique_new)
                
                total_cached = len(ai_questions_cache[cache_key])
                print(f"Added {len(unique_new)} new questions. Total cached for '{category}': {total_cached}")
                
                # Sauvegarde le cache dans le fichier pour le garder entre deux lancements
                save_cache_to_file()
                
                # Renvoie une selection aleatoire depuis toute la reserve
                return random.sample(ai_questions_cache[cache_key], min(num_questions, total_cached))
            
            # Si le parsing echoue mais que le cache existe, on l utilise
            if cached_count >= num_questions:
                return random.sample(ai_questions_cache[cache_key], num_questions)
            
            return None
            
    except Exception as e:
        print(f"Error generating questions: {e}")
        # Utilise le cache en secours si disponible
        if cached_count >= num_questions:
            return random.sample(ai_questions_cache[cache_key], num_questions)
        return None


def get_cache_stats() -> Dict[str, Any]:
    """Get statistics about the question cache"""
    stats = {}
    for key, questions in ai_questions_cache.items():
        stats[key] = {
            "count": len(questions),
            "ready": len(questions) >= MIN_CACHE_SIZE
        }
    return stats


def parse_ai_response(text: str) -> List[Dict]:
    """Parse AI response to extract questions JSON"""
    try:
        # Essaie de trouver un tableau JSON dans la reponse
        # Look for [ ... ] pattern
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            json_str = json_match.group()
            questions = json.loads(json_str)
            
            # Valide le format des questions
            valid_questions = []
            for q in questions:
                if (isinstance(q, dict) and 
                    "question" in q and 
                    "options" in q and 
                    "answer" in q and
                    isinstance(q["options"], list) and 
                    len(q["options"]) == 4 and
                    q["answer"] in q["options"]):
                    valid_questions.append({
                        "question": q["question"],
                        "options": q["options"],
                        "answer": q["answer"]
                    })
            
            return valid_questions if valid_questions else None
        
        return None
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"Parse error: {e}")
        return None


# Route IA : demande au modele de creer des questions pour une categorie personnalisee.
@app.post("/api/generate-questions")
async def api_generate_questions(request: Request):
    """API endpoint to generate custom category questions"""
    try:
        data = await request.json()
        category = data.get("category", "").strip()
        num_questions = min(data.get("count", 10), 20)  # Maximum 20 questions
        language = data.get("language", "fr")
        
        if not category:
            return JSONResponse(
                status_code=400,
                content={"error": "Category is required"}
            )
        
        if len(category) > 100:
            return JSONResponse(
                status_code=400,
                content={"error": "Category too long (max 100 characters)"}
            )
        
        questions = await generate_ai_questions(category, num_questions, language)
        
        if questions:
            return JSONResponse(content={
                "success": True,
                "questions": questions,
                "category": category,
                "count": len(questions)
            })
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Could not generate questions. The AI model might be loading. Please try again in a few seconds.",
                    "retry": True
                }
            )
            
    except Exception as e:
        print(f"API error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


@app.get("/api/check-model")
async def check_model_status():
    """Check if the HF model is ready"""
    if httpx is None:
        return JSONResponse(content={
            "ready": False,
            "message": "httpx is not installed, so AI generation is unavailable."
        })

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                HF_API_URL, 
                headers=headers, 
                json={"inputs": "test", "parameters": {"max_new_tokens": 1}}
            )
            
            if response.status_code == 503:
                return JSONResponse(content={"ready": False, "message": "Model is loading..."})
            elif response.status_code == 200:
                return JSONResponse(content={"ready": True, "message": "Model is ready"})
            else:
                return JSONResponse(content={"ready": False, "message": f"Error: {response.status_code}"})
    except Exception as e:
        return JSONResponse(content={"ready": False, "message": str(e)})


@app.get("/api/cache-stats")
async def cache_stats():
    """Get AI question cache statistics"""
    stats = get_cache_stats()
    total_questions = sum(len(q) for q in ai_questions_cache.values())
    total_categories = len(ai_questions_cache)
    
    return JSONResponse(content={
        "total_questions": total_questions,
        "total_categories": total_categories,
        "min_cache_size": MIN_CACHE_SIZE,
        "categories": stats
    })


app.mount("/static", StaticFiles(directory="static"), name="static")
