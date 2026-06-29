# Scalability Benchmark Summary

| Architecture | Clients | Runs | Avg latency ms | P95 latency ms | Failed messages | Throughput msg/s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| memory-single | 10 | 2 | 2.60 | 4.93 | 0 | 294.78 |
| memory-single | 25 | 2 | 5.06 | 7.92 | 0 | 722.81 |
| memory-single | 50 | 2 | 7.82 | 12.73 | 0 | 1246.36 |
| memory-single | 100 | 1 | 13.37 | 19.56 | 0 | 1948.54 |
| redis-pubsub-render | 10 | 1 | 125.54 | 130.22 | 0 | 52.37 |
| redis-pubsub-render | 25 | 1 | 122.61 | 130.46 | 0 | 122.12 |
| redis-pubsub-render | 50 | 1 | 122.30 | 141.86 | 0 | 213.02 |
| redis-pubsub-render | 100 | 1 | 122.01 | 170.98 | 0 | 294.51 |

Interpretation notes:

- Average latency shows the normal response time.
- P95 latency shows the slower edge of the user experience.
- Failed messages expose overload or routing problems.
- Redis Pub/Sub is mainly valuable because it keeps room events consistent across instances.