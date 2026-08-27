using System.Collections.Generic;

namespace TP06.Models
{
    /// <summary>
    /// Representa una habitación del mapa. Es también el punto de
    /// guardado: el usuario guarda a qué habitación pertenece.
    /// </summary>
    public class Habitacion
    {
        public int IdHabitacion { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }

        // Navegación
        public ICollection<Puerta> Puertas { get; set; } = new List<Puerta>();
        public ICollection<Interactivo> Interactivos { get; set; } = new List<Interactivo>();
        public ICollection<Usuario> UsuariosEnEstaHabitacion { get; set; } = new List<Usuario>();
    }
}
