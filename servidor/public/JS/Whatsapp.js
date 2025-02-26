window.onload = () =>
{
    const socket = io();
    let NombreOtroUsuario = document.createElement('NombreOtroUsuario');
    NombreOtroUsuario.className = 'NombreOtroUsuario';
    let ImagenOtroUsuario = document.getElementsByClassName('ImagenOtroUsuario');

    //Mostrar datos de usuario a los demás usuarios
    socket.on('ConexionRealizada',(DatosDeUsuario) =>
    { 
        console.log('Datos recibidos:', DatosDeUsuario);  

        NombreOtroUsuario.innerHTML = DatosDeUsuario.nombre;
        for (let i = 0; i < ImagenOtroUsuario.length; i++) 
        {
            ImagenOtroUsuario[i].src = DatosDeUsuario.avatar;
        }
    });

    socket.emit('ConexionRealizadaPropia',(DatosDeUsuario) =>
    { 
        console.log('Datos recibidos:', DatosDeUsuario);  
        MiImagen.src = DatosDeUsuario.Miavatar;
    });
}