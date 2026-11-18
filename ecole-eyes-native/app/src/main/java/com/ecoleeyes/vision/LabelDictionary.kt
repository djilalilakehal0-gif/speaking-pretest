package com.ecoleeyes.vision

import com.ecoleeyes.core.Lang

/**
 * French and Arabic names for the ML Kit on-device labels a blind user most often meets (home, street, food,
 * everyday objects). Unknown labels are spoken in lower-case English, which TTS engines pronounce acceptably.
 */
object LabelDictionary {
    private val table: Map<String, Pair<String, String>> = mapOf(
        // furniture and home
        "Chair" to ("chaise" to "كرسي"), "Table" to ("table" to "طاولة"), "Desk" to ("bureau" to "مكتب"),
        "Couch" to ("canapé" to "أريكة"), "Bed" to ("lit" to "سرير"), "Door" to ("porte" to "باب"),
        "Window" to ("fenêtre" to "نافذة"), "Shelf" to ("étagère" to "رف"), "Cabinetry" to ("placard" to "خزانة"),
        "Curtain" to ("rideau" to "ستارة"), "Lamp" to ("lampe" to "مصباح"), "Pillow" to ("oreiller" to "وسادة"),
        "Stairs" to ("escalier" to "درج"), "Kitchen" to ("cuisine" to "مطبخ"), "Bathroom" to ("salle de bain" to "حمام"),
        "Bedroom" to ("chambre" to "غرفة نوم"), "Living room" to ("salon" to "غرفة معيشة"), "Floor" to ("sol" to "أرضية"),
        "Wall" to ("mur" to "جدار"), "Tile" to ("carrelage" to "بلاط"), "Carpet" to ("tapis" to "سجادة"),
        "Sink" to ("évier" to "حوض"), "Toilet" to ("toilettes" to "مرحاض"), "Mirror" to ("miroir" to "مرآة"),
        "Clock" to ("horloge" to "ساعة حائط"), "Box" to ("boîte" to "صندوق"), "Bag" to ("sac" to "حقيبة"),
        "Handbag" to ("sac à main" to "حقيبة يد"), "Umbrella" to ("parapluie" to "مظلة"), "Bench" to ("banc" to "مقعد"),
        "Plant" to ("plante" to "نبتة"), "Flowerpot" to ("pot de fleurs" to "أصيص زهور"), "Flower" to ("fleur" to "زهرة"),
        // electronics
        "Television" to ("télévision" to "تلفاز"), "Computer" to ("ordinateur" to "حاسوب"), "Laptop" to ("ordinateur portable" to "حاسوب محمول"),
        "Mobile phone" to ("téléphone" to "هاتف"), "Keyboard" to ("clavier" to "لوحة مفاتيح"), "Monitor" to ("écran" to "شاشة"),
        "Screen" to ("écran" to "شاشة"), "Remote control" to ("télécommande" to "جهاز تحكم"),
        // kitchen and food
        "Cup" to ("tasse" to "كوب"), "Mug" to ("tasse" to "كوب"), "Bottle" to ("bouteille" to "زجاجة"), "Glass" to ("verre" to "كأس"),
        "Plate" to ("assiette" to "صحن"), "Bowl" to ("bol" to "وعاء"), "Cutlery" to ("couverts" to "أدوات المائدة"),
        "Tableware" to ("vaisselle" to "أواني المائدة"), "Food" to ("nourriture" to "طعام"), "Fruit" to ("fruit" to "فاكهة"),
        "Vegetable" to ("légume" to "خضار"), "Bread" to ("pain" to "خبز"), "Cake" to ("gâteau" to "كعكة"), "Pizza" to ("pizza" to "بيتزا"),
        "Drink" to ("boisson" to "مشروب"), "Coffee" to ("café" to "قهوة"), "Tea" to ("thé" to "شاي"), "Juice" to ("jus" to "عصير"),
        "Apple" to ("pomme" to "تفاحة"), "Banana" to ("banane" to "موزة"), "Orange" to ("orange" to "برتقالة"),
        "Egg" to ("œuf" to "بيضة"), "Meat" to ("viande" to "لحم"), "Cookie" to ("biscuit" to "بسكويت"),
        // clothes
        "Shoe" to ("chaussure" to "حذاء"), "Jacket" to ("veste" to "سترة"), "Jeans" to ("jean" to "جينز"), "Shirt" to ("chemise" to "قميص"),
        "Dress" to ("robe" to "فستان"), "Hat" to ("chapeau" to "قبعة"), "Glasses" to ("lunettes" to "نظارة"), "Sunglasses" to ("lunettes de soleil" to "نظارة شمسية"),
        "Scarf" to ("écharpe" to "وشاح"), "Sock" to ("chaussette" to "جورب"),
        // street and transport
        "Car" to ("voiture" to "سيارة"), "Bus" to ("bus" to "حافلة"), "Bicycle" to ("vélo" to "دراجة"), "Motorcycle" to ("moto" to "دراجة نارية"),
        "Vehicle" to ("véhicule" to "مركبة"), "Truck" to ("camion" to "شاحنة"), "Wheel" to ("roue" to "عجلة"), "Road" to ("route" to "طريق"),
        "Street" to ("rue" to "شارع"), "Crosswalk" to ("passage piéton" to "ممر مشاة"), "Traffic light" to ("feu de circulation" to "إشارة مرور"),
        "Sidewalk" to ("trottoir" to "رصيف"), "Tree" to ("arbre" to "شجرة"), "Grass" to ("herbe" to "عشب"), "Garden" to ("jardin" to "حديقة"),
        "Skyscraper" to ("gratte-ciel" to "ناطحة سحاب"), "Shop" to ("magasin" to "متجر"), "Fence" to ("clôture" to "سياج"),
        // animals and people
        "Dog" to ("chien" to "كلب"), "Cat" to ("chat" to "قطة"), "Bird" to ("oiseau" to "طائر"), "Horse" to ("cheval" to "حصان"),
        "Person" to ("personne" to "شخص"), "Baby" to ("bébé" to "رضيع"),
        // documents and objects
        "Paper" to ("papier" to "ورق"), "Book" to ("livre" to "كتاب"), "Newspaper" to ("journal" to "جريدة"), "Text" to ("texte" to "نص"),
        "Pen" to ("stylo" to "قلم"), "Money" to ("argent" to "نقود"), "Toy" to ("jouet" to "لعبة"), "Musical instrument" to ("instrument de musique" to "آلة موسيقية"),
        "Packaged goods" to ("produit emballé" to "منتج معبأ"), "Product" to ("produit" to "منتج"),
        // coarse object-detector categories
        "Home good" to ("objet de maison" to "غرض منزلي"), "Fashion good" to ("vêtement ou accessoire" to "ملابس أو إكسسوار"),
        "Place" to ("lieu" to "مكان"),
    )

    fun translate(label: String, lang: Lang): String {
        val t = table[label]
        return when (lang) {
            Lang.EN -> label.lowercase()
            Lang.FR -> t?.first ?: label.lowercase()
            Lang.AR -> t?.second ?: label.lowercase()
        }
    }

    fun knows(label: String) = label in table
}
