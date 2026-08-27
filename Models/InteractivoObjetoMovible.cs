namespace TP06.Models
{
    /// <summary>Datos propios del objeto movible.</summary>
    public class InteractivoObjetoMovible
    {
        public int IdInteractivo { get; set; }

        /// <summary>Cuánto se mueve/agranda cada vez que se interactúa con él.</summary>
        public float DistanciaMovimiento { get; set; }

        /// <summary>Tamaño/posición actual, para poder persistir el progreso.</summary>
        public float? TamanioActual { get; set; }

        public Interactivo Interactivo { get; set; } = null!;
    }
}
