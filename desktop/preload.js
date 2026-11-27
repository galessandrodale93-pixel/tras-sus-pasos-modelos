/* El juego sabe que corre en el programa de Windows (para las estadísticas y para no ofrecer «instalar la app»). */
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('KH_DESKTOP', { plataforma: 'windows', version: '1.0.0' });
