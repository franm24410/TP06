namespace TP06.Models
{
    /// <summary>
    /// Vincula el objeto llave del mundo con el Item que el jugador
    /// recibe al recogerlo. Ese Item ya sabe qué puerta abre (Item.KeyPuerta).
    /// </summary>
    public class InteractivoLlave
    {
        public int IdInteractivo { get; set; }
        public int IdItem { get; set; }

        public Interactivo Interactivo { get; set; } = null!;
        public Item Item { get; set; } = null!;
    }
}
