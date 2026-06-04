// ============================================================
//  room.js — Construcción y gestión de la habitación 3D
// ============================================================

import * as THREE from 'three';

// Configuración de las tres paredes visibles (no hay pared frontal)
const WALL_CONFIGS = (w, h, d) => [
    {
        id: 'back',
        pos: [0, h / 2, -d / 2],
        rot: [0, 0, 0],
        geo: [w, h],
        normal: new THREE.Vector3(0, 0, 1),
    },
    {
        id: 'left',
        pos: [-w / 2, h / 2, 0],
        rot: [0, Math.PI / 2, 0],
        geo: [d, h],
        normal: new THREE.Vector3(1, 0, 0),
    },
    {
        id: 'right',
        pos: [w / 2, h / 2, 0],
        rot: [0, -Math.PI / 2, 0],
        geo: [d, h],
        normal: new THREE.Vector3(-1, 0, 0),
    },
];

export class Room {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.floor = null;
        this.walls = [];
        this.dims  = { width: 5, depth: 4, height: 2.5 };
    }

    /**
     * Construye (o reconstruye) la habitación con las medidas indicadas.
     */
    build(width, depth, height) {
        // Limpiar habitación anterior
        if (this.group) this.scene.remove(this.group);
        this.walls = [];
        this.dims  = { width, depth, height };

        this.group = new THREE.Group();

        // Suelo
        const floorMat = new THREE.MeshStandardMaterial({ color: '#c19a6b', roughness: 0.3 });
        this.floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.group.add(this.floor);

        // Paredes
        const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
        WALL_CONFIGS(width, height, depth).forEach(conf => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...conf.geo), wallMat.clone());
            mesh.position.set(...conf.pos);
            mesh.rotation.set(...conf.rot);
            mesh.receiveShadow = true;
            mesh.userData = { isWall: true, ...conf };
            this.group.add(mesh);
            this.walls.push(mesh);
        });

        this.scene.add(this.group);
    }

    /** Cambia el color de todas las paredes */
    setWallColor(hexColor) {
        const color = new THREE.Color(hexColor);
        this.walls.forEach(wall => {
            wall.material.color.set(color);
            wall.material.needsUpdate = true;
        });
    }

    /** Cambia el color del suelo */
    setFloorColor(hexColor) {
        if (this.floor?.material) {
            this.floor.material.color.set(new THREE.Color(hexColor));
            this.floor.material.needsUpdate = true;
        }
    }

    /**
     * Mantiene un objeto completamente dentro de los límites de la habitación.
     * Para puertas/ventanas respeta el eje de deslizamiento a lo largo de su pared.
     */
    keepInside(obj) {
        if (!obj) return;

        const pad  = 0.02;
        const hw   = this.dims.width  / 2 - pad;
        const hd   = this.dims.depth  / 2 - pad;
        const data = obj.userData;

        // Puertas y ventanas: deslizamiento a lo largo de su pared
        if (data.type === 'door' || data.type === 'window') {
            const wallId   = data.snapWallId;
            const wallPos  = data.snapWallPos;
            const wallNorm = data.snapWallNormal;

            if (wallId === 'back') {
                obj.position.x = Math.max(-hw, Math.min(hw, obj.position.x));
                if (wallPos) obj.position.z = wallPos.z + (wallNorm?.z ?? 0) * 0.01;
            } else if (wallId === 'left' || wallId === 'right') {
                obj.position.z = Math.max(-hd, Math.min(hd, obj.position.z));
                if (wallPos) obj.position.x = wallPos.x + (wallNorm?.x ?? 0) * 0.01;
            }
            return;
        }

        // Resto de objetos: iteración para corregir por aristas reales
        for (let i = 0; i < 4; i++) {
            obj.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(obj);
            let dx = 0, dz = 0;
            if (box.min.x < -hw)  dx = -hw - box.min.x;
            if (box.max.x >  hw)  dx =  hw - box.max.x;
            if (box.min.z < -hd)  dz = -hd - box.min.z;
            if (box.max.z >  hd)  dz =  hd - box.max.z;
            if (dx === 0 && dz === 0) break;
            obj.position.x += dx;
            obj.position.z += dz;
        }

        // Mantener apoyado o a la altura definida por el usuario
        // (ya no sobreescribimos y = 0 aquí para permitir elevación manual)
    }


    /**
     * Pega un objeto (puerta/ventana) a la superficie de una pared.
     */
    snapToWall(obj, wall, hitPoint, type) {
        const { id: wallId, normal: wallNormal, position: wallPos } = wall.userData;
        const y = type === 'door' ? 0 : 1.2;

        const rotations = { back: [0, 0, 0], left: [0, Math.PI / 2, 0], right: [0, -Math.PI / 2, 0] };
        const rot = rotations[wallId] ?? [0, 0, 0];
        obj.rotation.set(...rot);

        const offset = 0.01;
        const wp = wall.position;
        const wn = wall.userData.normal;

        if (wallId === 'back') {
            obj.position.set(hitPoint.x, y, wp.z + wn.z * offset);
        } else {
            obj.position.set(wp.x + wn.x * offset, y, hitPoint.z);
        }

        // Guardar referencia de pared para keepInside
        obj.userData.snapWallId     = wallId;
        obj.userData.snapWallNormal = wn.clone();
        obj.userData.snapWallPos    = wp.clone();
    }

    /** Encuentra la pared más cercana a una posición 3D */
    nearestWall(position) {
        return this.walls.reduce((nearest, wall) => {
            const dist = wall.position.distanceTo(position);
            return dist < nearest.dist ? { wall, dist } : nearest;
        }, { wall: this.walls[0], dist: Infinity }).wall;
    }
}
