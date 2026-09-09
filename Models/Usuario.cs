using System;
using System.Collections.Generic;

namespace TP06.Models
{
    /// <summary>
    /// Cuenta de jugador. Guarda credenciales y la habitación actual
    /// (punto de guardado). No guarda el estado de sesión acá: eso
    /// vive en <see cref="Sesion"/> para poder tener control de
    /// expiración/cierre de sesión sin tocar la cuenta.
    /// </summary>
    public class Usuario
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string Contrasenia { get; set; } = string.Empty;
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string TipoUsuario { get; set; }

        /// <summary>
        /// Hash de la contraseña (nunca guardar la contraseña en texto plano).
        /// Se recomienda usar BCrypt.Net o el hasher de ASP.NET Identity.
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;

        public int IdHabitacionActual { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaUltimoLogin { get; set; }

        // Navegación
        public Habitacion HabitacionActual { get; set; } = null!;
        public ICollection<Sesion> Sesiones { get; set; } = new List<Sesion>();
        public ICollection<UsuarioEstadoInteractivo> EstadosInteractivos { get; set; } = new List<UsuarioEstadoInteractivo>();
        public ICollection<UsuarioEstadoPuerta> EstadosPuertas { get; set; } = new List<UsuarioEstadoPuerta>();
    }
}
