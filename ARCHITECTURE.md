# Arquitectura del Configurador de Cocinas Pro (v2)

Este editor implementa un flujo de trabajo profesional dividido en fases para asegurar la precisión del diseño.

## 1. Fase de Definición (Wizard)
Antes de comenzar el diseño 3D, el usuario debe definir el volumen del espacio.
- **Escalado Automático**: El motor Three.js ajusta los planos de suelo y paredes según los metros introducidos.
- **Normalización de Medidas**: La rejilla (grid) se ajusta para permitir un "snap" preciso cada 10cm.

## 2. Fase de Instalaciones (Puntos Técnicos)
Permite al usuario arrastrar iconos de "Agua" y "Luz" a las paredes.
- **Propósito**: Asegurar que la distribución de los muebles respeta las tomas de corriente y desagües preexistentes.
- **Visualización**: Representados por esferas de color (Azul para agua, Amarillo para luz) que flotan en el espacio.

## 3. Fase de Diseño e Inmersión
Basado en la estética de muebles grises de alto brillo y superficies de mármol.
- **Modo "Walk-in"**: Utiliza controles de tipo FPS (First Person Shooter) para permitir al usuario entrar físicamente en la cocina y verificar alturas y distancias desde una perspectiva humana.
- **Componentes Avanzados**:
    - **Fregadero**: Módulo con grifería integrada.
    - **Isla**: Módulo independiente con encimera perimetral.
    - **Columnas**: Integración de electrodomésticos (horno).

## 4. Motor Gráfico
- **Iluminación**: Uso de ACES Filmic Tone Mapping para un rango dinámico más realista.
- **Texturas**: Mapeado de texturas de mármol con repetición calculada según el tamaño de la habitación.
