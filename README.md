# 🚗 Transportes Melgar — React + Firebase

Sistema de gestión de Rent a Car usando **React + Vite + Firebase**.

## Lo que necesitás instalar

Solo una cosa: **Node.js**
- Descargá la versión LTS desde: https://nodejs.org
- Instalá normalmente (siguiente, siguiente, finalizar)

## Pasos para correr la app

### 1. Abrir la carpeta del proyecto

Descomprimí el ZIP en una carpeta fácil, por ejemplo `C:\transportes-melgar`

### 2. Abrir terminal en esa carpeta

En Windows: dentro de la carpeta, clic derecho → **"Abrir en Terminal"**
(o buscar `cmd` en inicio, luego escribir `cd C:\transportes-melgar`)

### 3. Instalar dependencias (solo la primera vez)

```bash
npm install
```

### 4. Correr la app

```bash
npm run dev
```

Luego abrí el navegador en: **http://localhost:5173**

## Crear el usuario administrador

Antes de entrar, necesitás crear el usuario en Firebase:

1. Ir a https://console.firebase.google.com → proyecto **renta-car-melgar**
2. Menú izquierdo → **Authentication** → **Users** → **Add user**
3. Email: `admin@melgar.com`
4. Password: `melgar2024`
5. Copiar el **UID** que aparece en la tabla

Luego en **Firestore Database** crear una colección `usuarios` con un documento cuyo ID sea el UID copiado:
```
nombre: "Administrador"
rol: "ADMIN"
email: "admin@melgar.com"
```

## Reglas de Firestore

En Firebase Console → Firestore → **Rules**, pegar esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Publicar en internet (Vercel) — opcional

```bash
npm run build
```
Subir la carpeta `dist` a https://vercel.com

## Stack
- React 18 + Vite
- Tailwind CSS
- Firebase (Firestore + Authentication)
- Recharts (gráficos)
