namespace TP06.Models
{
    /// <summary>Datos propios de los pinchos.</summary>
    public class InteractivoPinchos
    {
        public int IdInteractivo { get; set; }

        /// <summary>Descripción/clave de la condición que los desactiva.</summary>
        public string CondicionDesactivacion { get; set; } = string.Empty;

        /// <summary>True = todavía bloquea el paso.</summary>
        public bool EstaActivo { get; set; } = true;

        public Interactivo Interactivo { get; set; } = null!;
    }
}
