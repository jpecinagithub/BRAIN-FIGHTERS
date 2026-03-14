# Catalogo de juegos

Los juegos iniciales se cargan desde `backend/sql/seed.sql`.

| Codigo | Nombre | Descripcion | Icono |
| --- | --- | --- | --- |
| `simon` | Mision Simon | Reconocimiento de Patrones | `/games/simon.svg` |
| `puzzle` | Mision Puzzle | Reconstruccion de Imagen | `/games/puzzle.svg` |
| `memory` | Mision Memoria | Fortalecimiento Neural | `/games/memory.svg` |
| `math` | Mision Calculo | Velocidad Computacional | `/games/math.svg` |
| `stroop` | Stroop Express | Control Inhibitorio | `/games/stroop.svg` |
| `sequence` | Secuencia Logica | Patrones y series | `/games/sequence.svg` |
| `path` | Camino Fantasma | Memoria visuoespacial | `/games/path.svg` |
| `search` | Busqueda Visual | Agilidad visual | `/games/search.svg` |
| `rotation` | Rotacion Rapida | Rotacion mental | `/games/rotation.svg` |
| `compare` | Comparacion Relampago | Decision rapida | `/games/compare.svg` |
| `rule` | Parejas con Regla | Atencion y criterio | `/games/rule.svg` |
| `echo` | Eco Numerico | Memoria de trabajo | `/games/echo.svg` |

## Agregar un juego nuevo
1. Insertar el juego en la tabla `games`.
2. Agregar el icono en `backend/public/games`.
3. Crear el componente en `frontend/src/games`.
4. Actualizar el mapeo en `frontend/src/pages/GamePage.tsx`.
