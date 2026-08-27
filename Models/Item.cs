namespace TP06.Models
{
    /// <summary>
    /// Tabla única para todo objeto usable (arma, armadura, llave, etc.).
    /// Danio, Defensa y KeyPuerta quedan en null según el tipo de objeto.
    /// </summary>
    public class Item
    {
        public int IdItem { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int? Danio { get; set; }
        public int? Defensa { get; set; }

        /// <summary>Si el item es una llave, acá va el Id de la puerta que abre.</summary>
        public int? KeyPuerta { get; set; }

        // Navegación
        public Puerta? Puerta { get; set; }
        public InteractivoLlave? InteractivoLlave { get; set; }
    }
}
