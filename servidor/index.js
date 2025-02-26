const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const port = 3000
const server = createServer(app);
const io = new Server(server);
var numeroUsuarios = 0;
const usuarios = {}; // Para almacenar los datos de los usuarios conectados
const usuariosEscribiendo = new Set(); // Para rastrear quién está escribiendo

//Ruta base
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '/public/Componentes/InicioSesión.html'));
    console.log('peticion');
});

//Redireccionar a la paginas que contenga /public
app.use(express.static(path.join(__dirname, '/public')));

//Redireccionar a la pagina de error si no existe la ruta
app.use((req, res) => {
    res.status(404).sendFile(join(__dirname, '/public/Componentes/Error404.html'));
});


//Evento de conexión
io.on('connection', (socket) => 
{
    numeroUsuarios++;
    console.log('Numero de usuarios conectados: ' + numeroUsuarios);
    
    socket.on('UsuarioConectado',(DatosDeUsuario) =>
    {
        console.log('Nombre del usuario: ' + DatosDeUsuario.nombre + ' con avatar ' + DatosDeUsuario.avatar);
        
        // Guardar los datos del usuario asociados a su socket.id para acceder a ellos
        usuarios[socket.id] = {
            nombre: DatosDeUsuario.nombre,
            avatar: DatosDeUsuario.avatar
        };
        
        socket.nombre = DatosDeUsuario.nombre; //Para usar en otros eventos
        
        // Enviar a todos los demás usuarios que este usuario se ha conectado
        socket.broadcast.emit('ConexionRealizada', {
            nombre: DatosDeUsuario.nombre,
            avatar: DatosDeUsuario.avatar
        });
        
        // Enviar al nuevo usuario la lista de usuarios ya conectados
        const listaUsuarios = [];
        for (let id in usuarios) 
        {
            listaUsuarios.push(usuarios[id]);
        }
        socket.emit('UsuariosConectados', listaUsuarios);
    });

    // Manejar evento de "está escribiendo"
    socket.on('estoyEscribiendo', (nombre) => 
    {
        usuariosEscribiendo.add(nombre);
        io.emit('alguienEstaEscribiendo', nombre);
    });
    
    // Manejar evento de "dejó de escribir"
    socket.on('dejoDeEscribir', (nombre) => 
    {
        usuariosEscribiendo.delete(nombre);
        io.emit('alguienDejoDeEscribir');
    });

    //Evento de desconexión
    socket.on('disconnect', () => 
    {
        numeroUsuarios--;
        console.log('Numero de usuarios conectados: ' + numeroUsuarios);
        
        // Eliminar de la lista de usuarios escribiendo si estaba allí
        if (socket.nombre && usuariosEscribiendo.has(socket.nombre)) 
        {
            usuariosEscribiendo.delete(socket.nombre);
            io.emit('alguienDejoDeEscribir');
        }
        
        // Enviar notificación de desconexión si el usuario tenía nombre
        if (socket.nombre) 
        {
            socket.broadcast.emit('DesconexionRealizada', socket.nombre);
        }
        
        // Eliminar datos del usuario
        delete usuarios[socket.id];
    });

    socket.on('Mensaje',(datos) =>
    {
        console.log('Recibo msg= ' + datos.value);
        io.emit("MostrarMensaje", datos);
        
        // Si el usuario estaba escribiendo, ahora ya no
        if (datos.nombre && usuariosEscribiendo.has(datos.nombre)) 
        {
            usuariosEscribiendo.delete(datos.nombre);
            io.emit('alguienDejoDeEscribir');
        }
    });
});

//Iniciar el servidor usando el puerto 3000
server.listen(port, () => 
{
    console.log(`Example app listening on port ${port}`)
});