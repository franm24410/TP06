using System;

namespace TP06.Models
{
    /// <summary>
    /// Sesión activa de un usuario logueado. Se crea una nueva al
    /// iniciar sesión y se puede invalidar (Activa = false) al
    /// cerrar sesión o al expirar, sin necesidad de tocar la cuenta.
    /// </summary>
    public class Sesion
    {
        public int IdSesion { get; set; }
        public int IdUsuario { get; set; }

        /// <summary>Token opaco que el cliente guarda y reenvía en cada request.</summary>
        public string Token { get; set; } = Guid.NewGuid().ToString("N");

        public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
        public DateTime FechaExpiracion { get; set; }
        public bool Activa { get; set; } = true;
        public string? DireccionIp { get; set; }

        // Navegación
        public Usuario Usuario { get; set; } = null!;

        /// <summary>True si la sesión sigue activa y no expiró.</summary>
        public bool EstaVigente() => Activa && DateTime.UtcNow < FechaExpiracion;
    }
}
