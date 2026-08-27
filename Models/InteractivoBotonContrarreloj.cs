namespace TP06.Models
{
    /// <summary>Datos propios del botón a contrarreloj.</summary>
    public class InteractivoBotonContrarreloj
    {
        /// <summary>PK y a la vez FK a Interactivo (relación 1 a 1).</summary>
        public int IdInteractivo { get; set; }

        public int TiempoActivoSegundos { get; set; }

        public Interactivo Interactivo { get; set; } = null!;
    }
}
