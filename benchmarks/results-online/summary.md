# Scalability Benchmark Summary

| Architecture | Clients | Runs | Avg latency ms | P95 latency ms | Failed messages | Throughput msg/s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| online-memory | 10 | 1 | 114.48 | 129.36 | 0 | 53.44 |
| online-memory | 25 | 1 | 120.85 | 130.97 | 0 | 119.24 |
| online-memory | 50 | 1 | 121.31 | 131.73 | 0 | 213.27 |
| online-memory | 100 | 1 | 123.59 | 177.71 | 0 | 337.11 |
| online-redis | 10 | 1 | 122.24 | 134.27 | 0 | 52.30 |
| online-redis | 25 | 1 | 117.06 | 132.55 | 0 | 124.62 |
| online-redis | 50 | 1 | 120.59 | 132.58 | 0 | 222.09 |
| online-redis | 100 | 1 | 123.06 | 174.20 | 0 | 341.40 |

Interpretation notes:

- Average latency shows the normal response time.
- P95 latency shows the slower edge of the user experience.
- Failed messages expose overload or routing problems.
- Redis Pub/Sub is mainly valuable because it keeps room events consistent across instances.