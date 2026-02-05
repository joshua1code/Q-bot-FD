let TESTING = false;
let HOST = "qbot.mooo.com";

if(import.meta.env?.VITE_LOCAL_DEV === 'true'){
    TESTING = true;
    HOST = "127.0.0.1:8000";
}

const API_BASE_URL = `http${TESTING ? '' : 's'}://${HOST}`;
const WSS_API_BASE_URL = `ws${TESTING ? '' : 's'}://${HOST}`;

export {API_BASE_URL, WSS_API_BASE_URL};