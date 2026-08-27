using System.Collections.Generic;

namespace TP06.Models
{
    /// <summary>
    /// Puerta ubicada dentro de una habitación. Puede requerir un Item
    /// (llave) para abrirse.
    /// </summary>
    public class Puerta
    {
        public int IdPuerta { get; set; }
        public int IdHabitacion { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool EstaAbierta { get; set; }

        // Navegación
        public Habitacion Habitacion { get; set; } = null!;

        /// <summary>Items (llaves) que abren esta puerta.</summary>
        public ICollection<Item> Items { get; set; } = new List<Item>();
    }
}
