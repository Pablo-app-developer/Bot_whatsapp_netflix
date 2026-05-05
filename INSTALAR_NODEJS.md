# ⚙️ INSTALACIÓN DE NODE.JS

## 🚨 IMPORTANTE
Para que el bot de WhatsApp funcione, necesitas tener **Node.js** instalado.

---

## 📥 DESCARGAR E INSTALAR

### Opción 1: Descarga Directa (Recomendado)
1. Ve a: **https://nodejs.org/**
2. Descarga la versión **LTS** (recomendada)
3. Ejecuta el instalador `.msi`
4. Acepta todas las opciones por defecto
5. **IMPORTANTE:** Marca la casilla "Automatically install necessary tools"

### Opción 2: Winget (Windows 11)
```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ✅ VERIFICAR INSTALACIÓN

Abre una **nueva terminal PowerShell** y ejecuta:

```powershell
node --version
```

Deberías ver algo como: `v20.11.0`

```powershell
npm --version
```

Deberías ver algo como: `10.2.4`

---

## 🔄 ¿YA TENÍAS NODE.JS?

Si ya tenías Node.js instalado pero el comando falla:

1. **Cierra TODAS las terminales abiertas**
2. Abre una **nueva terminal PowerShell**
3. Intenta de nuevo: `node --version`

Si sigue sin funcionar:
1. Busca "Environment Variables" en Windows
2. Verifica que `C:\Program Files\nodejs\` esté en PATH
3. Reinicia la computadora

---

## 📦 DESPUÉS DE INSTALAR NODE.JS

Una vez instalado Node.js, ejecuta:

```powershell
# Ir a la carpeta del backend
cd "c:\Users\Personal\Documents\VENTA CUENTAS NETFLIX 1\backend"

# Instalar dependencias
npm install

# Verificar que todo esté OK
npm run test
```

---

## 🎯 SIGUIENTE PASO

Después de instalar Node.js y las dependencias:
1. Configurar archivo `.env` → Ver [QUICK_START.md](QUICK_START.md)
2. Obtener credenciales de Meta → Ver [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md)
3. Iniciar el bot → `npm start`

---

## 💡 ¿PROBLEMAS?

### Error: "npm no se reconoce"
- Reinicia la terminal después de instalar Node.js
- Verifica que Node.js se instaló correctamente: busca `Node.js` en el menú de Windows

### Error de permisos
- Ejecuta PowerShell como Administrador
- Ejecuta: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Versión muy antigua
- Desinstala Node.js desde Panel de Control
- Descarga la versión LTS más reciente
- Reinstala

---

¡Una vez tengas Node.js, estarás listo para configurar el bot! 🚀
