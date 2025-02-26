window.onload = function() 
{
    if(window.location.pathname.includes("InicioSesión.html") || window.location.pathname === "/")//Comprobar si el usuario está en la página de inicio de sesión
    {
        //Gestion de avatares
        const Avatares = [
            "../Img/Avatares/Avatar1.jpg",
            "../Img/Avatares/Avatar2.jpg",
            "../Img/Avatares/Avatar3.jpg",
            "../Img/Avatares/Avatar4.jpg",
            "../Img/Avatares/Avatar5.jpg",
            "../Img/Avatares/Avatar6.jpg",
            "../Img/Avatares/Avatar7.jpg",
            "../Img/Avatares/Avatar8.jpg",
            "../Img/Avatares/Avatar9.jpg",
            "../Img/Avatares/Avatar10.jpg",
        ]
        // Generar el carrusel de avatares
        let carouselInnerAvatar = document.getElementById('carouselInnerAvatar');
        let avatarSeleccionadoInput = document.getElementById('avatarSeleccionado');
        avatarSeleccionadoInput.value = Avatares[0];
        for (let i = 0; i < Avatares.length; i++) 
        {
            let div = document.createElement('div');
            if(i === 0)
            {
                div.className = 'carousel-item active';
            }
            else
            {
                div.className = 'carousel-item';
            }
            let img = document.createElement('img');
            img.src = Avatares[i];
            img.alt = 'Imagen de ' + i;
            div.appendChild(img);
            carouselInnerAvatar.appendChild(div);

            img.addEventListener('click', function() 
            {
                avatarSeleccionadoInput.value = Avatares[i];
            });
        }


        //Gestion de servidor
        const socket = io();
        let NombreUsuario = document.getElementById('NombreUsuario');
        let ErrorDeDatos = document.getElementById('ErrorDeDatos');
        let IniciarSesion = document.getElementById('IniciarSesion');
        let Redireccionar = document.getElementById('Redireccionar');
        
        if (NombreUsuario === null) 
        {
            ErrorDeDatos.innerHTML = "El nombre de usuario no puede estar vacío.";
        }
        
        //Guarda el nombre del usuario en el servidor
        IniciarSesion.addEventListener('click',() =>
        {
            if (NombreUsuario && NombreUsuario.value.trim() !== "") 
            {
                let DatosDeUsuario = 
                {
                    nombre : NombreUsuario.value,
                    avatar : avatarSeleccionadoInput.value
                }
                // Guardar el avatar en localStorage para acceder a la página de chat
                localStorage.setItem('miAvatar', avatarSeleccionadoInput.value);
                localStorage.setItem('miNombre', NombreUsuario.value);
                
                socket.emit('UsuarioConectado', DatosDeUsuario);
                Redireccionar.href = "/Componentes/Whatsapp.html";
            } 
            else 
            {
                ErrorDeDatos.innerHTML = "El nombre de usuario no puede estar vacío.";
            }
        });
    }
    else if(window.location.pathname.includes("Whatsapp.html"))//Si el usuario está en la página de chat
    {
        const socket = io();
        let NombreOtroUsuario = document.getElementById('NombreOtroUsuario');
        let ImagenOtroUsuario = document.getElementsByClassName('ImagenOtroUsuario');
        let MiImagen = document.getElementById('MiImagen');
        let contact = document.getElementById('contact');
        let mensajeInput = document.getElementById('mensaje');
        let chatMessages = document.querySelector('.Chat-Messages');
        let estadoGrupo = document.querySelector('.data-person p');

        // Usar mi propia imagen en mi perfil propio
        if (MiImagen) 
        {
            const miAvatarGuardado = localStorage.getItem('miAvatar');
            if (miAvatarGuardado) 
            {
                MiImagen.src = miAvatarGuardado;
                console.log("Mi imagen cargada: " + miAvatarGuardado);
            }
        }

        // Emitir mis datos al conectarme al chat para que se muestren en la lista de contactos de los demás usuarios
        const miNombre = localStorage.getItem('miNombre');
        const miAvatar = localStorage.getItem('miAvatar');
        
        if (miNombre && miAvatar) 
        {
            const misDatos = {
                nombre: miNombre,
                avatar: miAvatar
            };
            socket.emit('UsuarioConectado', misDatos);
        }

        // Array para almacenar usuarios ya añadidos
        let usuariosAgregados = [];
        let contacts = document.getElementById('contacts');
        
        // Función para añadir mensajes al chat
        function addMessage(message, isMe, nombre) 
        {
            const messageDiv = document.createElement('div');
            messageDiv.className = isMe ? 'Message me' : 'Message otherperson';//Asignar la clase correcta al mensaje dependiendo si es yo o el otro usuario
            
            const messageParagraph = document.createElement('p');
            messageParagraph.textContent = `${nombre}: ${message}`;//Mostrar el mensaje en el chat
            
            messageDiv.appendChild(messageParagraph);
            chatMessages.appendChild(messageDiv);
            
            //Scroll para que el mensaje se muestre al final del chat
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Enviar mensaje cuando se presiona Enter
        if (mensajeInput) 
        {
            mensajeInput.addEventListener('keypress', function(e) 
            {
                if (e.key === 'Enter' && mensajeInput.value.trim() !== '') 
                {
                    const mensaje = mensajeInput.value;
                    socket.emit('Mensaje', {
                        nombre: miNombre,
                        value: mensaje
                    });
                    mensajeInput.value = '';

                    // Indicar que ya no estamos escribiendo
                    socket.emit('dejoDeEscribir', miNombre);
                }
            });
            
            // Detectar cuando el usuario está escribiendo
            let typingTimeout;
            mensajeInput.addEventListener('input', function() 
            {
                // Limpiar el timeout anterior
                clearTimeout(typingTimeout);
                
                //Controlar si el usuario ha dejado de escribir
                if (mensajeInput.value.trim() !== '') 
                {
                    // Enviar al servidor que estamos escribiendo
                    socket.emit('estoyEscribiendo', miNombre);

                    // Configurar un timeout para dejar de escribir después de 3 segundos de inactividad
                    typingTimeout = setTimeout(function() {
                        socket.emit('dejoDeEscribir', miNombre);
                    }, 3000);
                } 
                else 
                {
                    // Si el campo está vacío, indicar que ya no estamos escribiendo
                    socket.emit('dejoDeEscribir', miNombre);
                }
            });
        }
        
        // Mostrar mensajes recibidos
        socket.on('MostrarMensaje', function(datos) 
        {
            const isMe = datos.nombre === miNombre;
            addMessage(datos.value, isMe, datos.nombre);
        });
        
        // Mostrar cuándo un usuario está escribiendo
        socket.on('alguienEstaEscribiendo', function(nombre) 
        {
            if (nombre !== miNombre && estadoGrupo) 
            {
                estadoGrupo.textContent = nombre + ' está escribiendo...';
            }
        });
        
        // Mostrar cuándo un usuario deja de escribir
        socket.on('alguienDejoDeEscribir', function() 
        {
            if (estadoGrupo) 
            {
                estadoGrupo.textContent = 'online';
            }
        });
        
        // Mostrar cuándo un usuario se conecta o desconecta
        socket.on('DesconexionRealizada', function(nombre) 
        {
            addMessage(`${nombre} ha salido del chat`, false);
        });
        
        //Mostrar datos de usuario a los demás usuarios
        socket.on('ConexionRealizada',(DatosDeUsuario) =>
        { 
            console.log('Datos recibidos:', DatosDeUsuario);
            
            // Mostrar mensaje de conexión en el chat
            if (DatosDeUsuario.nombre !== miNombre) 
            {
                addMessage(`${DatosDeUsuario.nombre} ha entrado al chat`, false);
            }
            
            // Comprobar si este usuario ya está en la lista
            if (usuariosAgregados.includes(DatosDeUsuario.nombre)) 
            {
                console.log('Usuario ya agregado:', DatosDeUsuario.nombre);
                return; // No agregar duplicados
            }
            
            // Agregar a la lista de usuarios
            usuariosAgregados.push(DatosDeUsuario.nombre);
            
            // Solo crear el nuevo contacto si el elemento 'contacts' existe
            if (contacts) 
            {
                // Crear el contenedor principal
                let viewContact = document.createElement('div');
                viewContact.className = 'ViewContact';
                viewContact.setAttribute('data-usuario', DatosDeUsuario.nombre);

                // Crear el contenedor de la imagen
                let contenedorImagen = document.createElement('div');
                contenedorImagen.className = 'contenedor-imagen';

                // Crear la imagen del usuario
                let imagenOtroUsuario = document.createElement('img');
                imagenOtroUsuario.className = 'ImagenOtroUsuario';
                imagenOtroUsuario.src = DatosDeUsuario.avatar;

                // Agregar la imagen al contenedor
                contenedorImagen.appendChild(imagenOtroUsuario);

                // Crear el contenedor de datos del usuario
                let dataPerson = document.createElement('div');
                dataPerson.className = 'data-person';

                // Crear el nombre del usuario
                let nombreUsuario = document.createElement('h2');
                nombreUsuario.className = 'NombreContacto';
                nombreUsuario.textContent = DatosDeUsuario.nombre;

                // Crear el estado de escritura
                let estadoUsuario = document.createElement('p');
                estadoUsuario.className = 'EstadoUsuario';
                estadoUsuario.textContent = 'online';

                // Agregar elementos al contenedor de datos
                dataPerson.appendChild(nombreUsuario);
                dataPerson.appendChild(estadoUsuario);

                // Agregar los contenedores al contenedor principal
                viewContact.appendChild(contenedorImagen);
                viewContact.appendChild(dataPerson);

                // Agregar el contenedor principal al contenedor de contactos
                contacts.appendChild(viewContact);
            } 
            else 
            {
                console.error('El elemento "contacts" no existe en el documento');
            }
        });
    }
}