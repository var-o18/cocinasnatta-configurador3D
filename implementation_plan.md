# Plan de Implementación: Solución de bloqueo del visor y optimización 3D

Este plan detalla los pasos para solucionar el estado bloqueado de la aplicación ("quedarse pillado" en la pantalla de carga) y configurar la carga optimizada de modelos 3D usando Draco, Meshopt y KTX2.

## User Review Required

> [!IMPORTANT]
> **Origen del error:** La aplicación se queda congelada en "Cargando modelos 3D..." debido a dos motivos principales:
> 1. El archivo principal [main.js](file:///c:/Users/Usuario/Desktop/modelo3dpruebas/main.js) está completamente vacío (0 bytes). Ningún código inicializa la interfaz o inicia las descargas.
> 2. Falta el archivo `loader.js` (el cual es requerido por [KitchenEditor.js](file:///c:/Users/Usuario/Desktop/modelo3dpruebas/src/app/KitchenEditor.js) en sus imports).
> 3. Los modelos 3D que se intentan cargar pesan hasta **84 MB** cada uno, lo cual satura la memoria del navegador y la GPU.
>
> Para solucionarlo, restauraremos la lógica principal en el archivo del proyecto y añadiremos el cargador avanzado con soporte para compresión.

## Proposed Changes

### 1. Módulos de Código Principal

#### [MODIFY] [main.js](file:///c:/Users/Usuario/Desktop/modelo3dpruebas/main.js)
Copiaremos la estructura de control principal desde [KitchenEditor.js](file:///c:/Users/Usuario/Desktop/modelo3dpruebas/src/app/KitchenEditor.js) al archivo raíz `main.js` para que se ejecute al cargar `index.html`.

#### [NEW] [loader.js](file:///c:/Users/Usuario/Desktop/modelo3dpruebas/loader.js)
Crearemos el cargador de recursos con soporte nativo para:
*   `GLTFLoader` (Three.js standard)
*   `DRACOLoader` (Compresión geométrica)
*   `KTX2Loader` (Texturas comprimidas directamente en GPU)
*   `MeshoptDecoder` (Optimización y descompresión ultrarrápida)
*   `FBXLoader` (Para compatibilidad con modelos FBX definidos en el catálogo)

### 2. Archivos Estáticos de Decodificación (WASM)

Copiaremos las carpetas de soporte de decodificación de `node_modules` a la carpeta `public` para que Vite las sirva como contenido estático:
*   `node_modules/three/examples/jsm/libs/draco/` -> `public/draco/`
*   `node_modules/three/examples/jsm/libs/basis/` -> `public/basis/`

---

## Verification Plan

### Automated Tests
*   Ejecutar `npm run build` para asegurar que el empaquetador Vite compile todos los archivos JS sin errores de importación o sintaxis.

### Manual Verification
*   Iniciar el servidor de desarrollo local con `npm run dev`.
*   Comprobar en la consola del navegador que el mensaje `[KitchenEditor] main.js cargando…` se imprima correctamente y que el asistente inicial se muestre sin congelar la pestaña.
