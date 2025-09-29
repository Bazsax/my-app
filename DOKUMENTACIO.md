# Személyes Pénzügyi Menedzsment Rendszer

## Áttekintés

Egy átfogó személyes pénzügyi menedzsment alkalmazás, amely Next.js 15, TypeScript és MySQL technológiákkal készült. Ez a rendszer lehetővé teszi a felhasználók számára, hogy nyomon kövessék bevételeiket és kiadásaikat, kezeljék tranzakcióikat, és elemezzék pénzügyi adataikat interaktív diagramokon és jelentéseken keresztül.

## Funkciók

### 🔐 Hitelesítés és Felhasználókezelés
- **Felhasználói regisztráció**: Új fiókok létrehozása email és jelszó megadásával
- **Biztonságos bejelentkezés**: JWT-alapú hitelesítés 7 napos token lejárattal
- **Profilkezelés**: Felhasználói információk frissítése és jelszóváltoztatás
- **Jelszó biztonság**: Bcrypt hashelés a biztonságos jelszó tároláshoz

### 💰 Tranzakciókezelés
- **Tranzakció hozzáadása**: Bevétel és kiadás bejegyzések létrehozása részletes információkkal
- **Tranzakció szerkesztése**: Meglévő tranzakció részleteinek módosítása
- **Tranzakció törlése**: Egyedi vagy több tranzakció eltávolítása
- **Tranzakció típusok**: Egyszeri, ismétlődő és idővonal-alapú tranzakciók támogatása
- **Kategóriák és alkategóriák**: Tranzakciók rendszerezése egyedi kategóriákkal
- **Szerkeszthető kategóriák**: Egyedi kategóriák szerkesztése és törlése toll és kuka ikonokkal
- **Kategória kezelés**: Kategóriák és alkategóriák hozzáadása, szerkesztése és törlése
- **Tranzakció frissítések**: Meglévő tranzakciók automatikus frissítése kategória átnevezéskor
- **Beépített szerkesztés**: Dupla kattintással szerkeszthető kategória-, alkategória- és leírás közvetlenül a tranzakció táblázatban
- **Vizuális jelzők**: Zár ikonok mutatják az előre definiált (zárt) és egyedi (nyitott) kategóriákat
- **Mobilbarát szerkesztés**: Mentés/Mégse gombok mobil eszközökhöz érintésbarát felülettel
- **Üres alkategória létrehozás**: Dupla kattintás üres alkategória cellákra új alkategóriák létrehozásához
- **Leírás szerkesztés**: Dupla kattintás bármely leírásra a tranzakció részletek szerkesztéséhez

### 📊 Adatvizualizáció
- **Interaktív diagramok**: Bevétel vs kiadás vizuális ábrázolása időben
- **Dátumtartomány szűrés**: Adatok elemzése meghatározott időszakokra
- **Valós idejű frissítések**: Diagramok automatikusan frissülnek adatváltozáskor

### 🔍 Fejlett szűrés és keresés
- **Többkritériumos szűrés**: Szűrés tranzakció típus, kategória és dátumtartomány szerint
- **Szöveges keresés**: Tranzakciók keresése cím és leírás kulcsszavak alapján
- **Egyedi kategóriák**: Felhasználó által létrehozott kategóriák dinamikus betöltése teljes CRUD műveletekkel
- **Tömeges műveletek**: Több tranzakció kiválasztása és egyidejű kezelése
- **Frissítési funkció**: Kézi frissítés gomb a tranzakció adatok frissítéséhez

### 📋 Adatkezelés
- **Oszlop testreszabás**: Táblázat oszlopok megjelenítése/elrejtése felhasználói beállítások alapján
- **CSV export**: Szűrt vagy kiválasztott tranzakciók exportálása CSV formátumba
- **Reszponzív dizájn**: Asztali és mobil eszközökre optimalizálva
- **Mobil elrendezés**: Egymás alá rendezett gomb elrendezés töréssel mobil képernyőkhöz
- **Érintésbarát felület**: Optimalizált gombok és interakciók mobil eszközökhöz

## Technológiai Stack

### Frontend
- **Next.js 15**: React keretrendszer App Router-rel
- **TypeScript**: Típusbiztos fejlesztés
- **Tailwind CSS**: Utility-first CSS keretrendszer
- **Radix UI**: Elérhető komponens primitívek
- **Recharts**: Adatvizualizációs könyvtár
- **Tabler Icons**: Ikon könyvtár
- **Sonner**: Toast értesítések

### Backend
- **Next.js API Routes**: Szerveroldali API végpontok
- **MySQL**: Relációs adatbázis
- **JWT**: JSON Web Token hitelesítéshez
- **Bcryptjs**: Jelszó hashelés
- **Date-fns**: Dátum manipulációs könyvtár

### Adatbázis Séma

#### Teljes Adatbázis Beállítás
```sql
-- Adatbázis létrehozása
CREATE DATABASE IF NOT EXISTS cost_tracker;
USE cost_tracker;

-- Felhasználók tábla
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Felhasználói munkamenetek tábla (JWT token kezeléshez)
CREATE TABLE user_sessions (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_token_hash (token_hash),
    KEY idx_expires_at (expires_at),
    CONSTRAINT user_sessions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Költség bejegyzések tábla (tranzakciók)
CREATE TABLE cost_entries (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    type ENUM('income','expense') DEFAULT 'expense',
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    subcategory VARCHAR(100) DEFAULT NULL,
    date DATE NOT NULL,
    time TIME DEFAULT NULL,
    transaction_type ENUM('one-time','recurring','timeline') DEFAULT 'one-time',
    frequency ENUM('daily','weekly','monthly','yearly') DEFAULT 'monthly',
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_date (date),
    KEY idx_category (category),
    KEY idx_cost_entries_user_date (user_id,date),
    KEY idx_cost_entries_category (category),
    KEY idx_transaction_type (transaction_type),
    KEY idx_cost_entries_type (type),
    KEY idx_cost_entries_user_type (user_id,type),
    KEY idx_cost_entries_subcategory (subcategory),
    KEY idx_cost_entries_category_subcategory (category,subcategory),
    KEY idx_cost_entries_time (time),
    KEY idx_cost_entries_date_time (date,time),
    CONSTRAINT cost_entries_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Egyedi kategóriák tábla
CREATE TABLE custom_categories (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income','expense') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_category (user_id,name,type),
    KEY idx_user_id (user_id),
    KEY idx_type (type),
    CONSTRAINT custom_categories_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Egyedi alkategóriák tábla
CREATE TABLE custom_subcategories (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    subcategory_name VARCHAR(100) NOT NULL,
    type ENUM('income','expense') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_subcategory (user_id,category_name,subcategory_name,type),
    KEY idx_user_id (user_id),
    KEY idx_category (category_name),
    KEY idx_type (type),
    CONSTRAINT custom_subcategories_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### Adatbázis Séma Áttekintés

**Táblák:**
1. **`users`** - Felhasználói fiókok és hitelesítés
2. **`user_sessions`** - JWT token kezelés (opcionális)
3. **`cost_entries`** - Fő tranzakció tábla
4. **`custom_categories`** - Felhasználó által definiált kategóriák
5. **`custom_subcategories`** - Felhasználó által definiált alkategóriák

**Kulcsfontosságú funkciók:**
- **Idegen kulcs korlátozások**: Adatintegritás biztosítása CASCADE törlésekkel
- **Optimalizált indexek**: Gyors lekérdezések user_id, date, category, type alapján
- **UTF8MB4 kódolás**: Teljes Unicode támogatás nemzetközi karakterekhez
- **Auto-increment ID-k**: Automatikus elsődleges kulcs generálás
- **Időbélyegek**: Automatikus created_at és updated_at követés

## API Végpontok

### Hitelesítés
- `POST /api/auth/register` - Felhasználói regisztráció
- `POST /api/auth/login` - Felhasználói bejelentkezés
- `POST /api/auth/update-profile` - Felhasználói profil frissítése

### Tranzakciók
- `GET /api/transactions` - Felhasználói tranzakciók lekérése (opcionális szűréssel)
- `POST /api/transactions/add` - Új tranzakció hozzáadása
- `PUT /api/transactions/[id]` - Tranzakció frissítése
- `DELETE /api/transactions/[id]` - Tranzakció törlése
- `GET /api/transactions/summary` - Tranzakció összefoglaló
- `GET /api/transactions/chart` - Diagram adatok

### Kategóriák
- `GET /api/categories` - Egyedi kategóriák lekérése
- `POST /api/categories` - Egyedi kategória hozzáadása
- `PUT /api/categories` - Kategória nevének frissítése
- `DELETE /api/categories` - Egyedi kategória törlése
- `GET /api/subcategories` - Alkategóriák lekérése
- `POST /api/subcategories` - Alkategória hozzáadása
- `PUT /api/subcategories` - Alkategória nevének frissítése
- `DELETE /api/subcategories` - Alkategória törlése

## Kezdés

### Előfeltételek

Az alkalmazás helyi futtatásához a következő szoftverek telepítése szükséges:

#### 1. **Node.js** (Kötelező)
- **Verzió**: Node.js 18.0 vagy újabb
- **Letöltés**: [https://nodejs.org/](https://nodejs.org/)
- **Cél**: JavaScript futási környezet a Next.js alkalmazás futtatásához
- **Ellenőrzés**: Futtassa a `node --version` parancsot a terminálban

#### 2. **MySQL Adatbázis** (Kötelező)
- **Verzió**: MySQL 8.0 vagy újabb
- **Letöltési lehetőségek**:
  - **Windows**: [MySQL Installer](https://dev.mysql.com/downloads/installer/)
  - **macOS**: [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) vagy használja a Homebrew-ot: `brew install mysql`
  - **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian) vagy `sudo yum install mysql-server` (CentOS/RHEL)
- **Cél**: Adatbázis felhasználói adatok és tranzakciók tárolásához
- **Ellenőrzés**: Futtassa a `mysql --version` parancsot a terminálban

#### 3. **Csomagkezelő** (Kötelező)
Válasszon egyet a következők közül:
- **npm**: Node.js-szel együtt jön (ajánlott)
- **yarn**: Telepítse a `npm install -g yarn` paranccsal
- **pnpm**: Telepítse a `npm install -g pnpm` paranccsal
- **bun**: Telepítse a [https://bun.sh/](https://bun.sh/) oldalról

#### 4. **Git** (Kötelező fejlesztéshez)
- **Letöltés**: [https://git-scm.com/](https://git-scm.com/)
- **Cél**: Verziókezelés és repository klónozás
- **Ellenőrzés**: Futtassa a `git --version` parancsot a terminálban

#### 5. **Kódszerkesztő** (Ajánlott)
- **Visual Studio Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **WebStorm**: [https://www.jetbrains.com/webstorm/](https://www.jetbrains.com/webstorm/)
- **Sublime Text**: [https://www.sublimetext.com/](https://www.sublimetext.com/)

#### 6. **Adatbázis Menedzsment Eszköz** (Opcionális, de ajánlott)
- **MySQL Workbench**: [https://dev.mysql.com/downloads/workbench/](https://dev.mysql.com/downloads/workbench/)
- **phpMyAdmin**: Ha XAMPP/WAMP-ot használ
- **DBeaver**: [https://dbeaver.io/](https://dbeaver.io/)
- **TablePlus**: [https://tableplus.com/](https://tableplus.com/)

### Rendszerkövetelmények

#### **Minimális Rendszerkövetelmények**
- **RAM**: 4GB
- **Tárhely**: 2GB szabad hely
- **OS**: Windows 10, macOS 10.15, vagy Linux (Ubuntu 18.04+)

#### **Ajánlott Rendszerkövetelmények**
- **RAM**: 8GB vagy több
- **Tárhely**: 5GB szabad hely
- **OS**: Windows 11, macOS 12+, vagy Linux (Ubuntu 20.04+)

### Telepítés Ellenőrzése

Az előfeltételek telepítése után ellenőrizze a beállítását:

```bash
# Node.js verzió ellenőrzése (18.0+ kell)
node --version

# npm verzió ellenőrzése
npm --version

# MySQL verzió ellenőrzése (8.0+ kell)
mysql --version

# Git verzió ellenőrzése
git --version
```

### Alternatív Beállítási Lehetőségek

#### **XAMPP használata (Windows/macOS/Linux)**
Ha egy mindent-egyben megoldást preferál:
1. Töltse le a [XAMPP](https://www.apachefriends.org/)-ot
2. Telepítse a XAMPP-ot (MySQL, Apache, PHP-t tartalmaz)
3. Indítsa el a MySQL szolgáltatást a XAMPP Vezérlőpultról
4. Használja a phpMyAdmin-t (benne van) az adatbázis kezeléshez

#### **Docker használata (Haladó)**
Konténeres fejlesztési környezethez:
```bash
# MySQL futtatása Docker-ben
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=cost_tracker -p 3306:3306 -d mysql:8.0

# Alkalmazás futtatása
npm run dev
```

### Telepítés

1. **Repository klónozása**
   ```bash
   git clone <repository-url>
   cd main-project
   ```

2. **Függőségek telepítése**
   ```bash
   npm install
   ```

3. **Környezeti változók beállítása**
   Hozzon létre egy `.env.local` fájlt (ha a repo nem tartalmazza):
   ```env
   JWT_SECRET=your-secret-key-change-this-in-production
   DB_HOST=localhost
   DB_USER=your-mysql-username
   DB_PASSWORD=your-mysql-password
   DB_NAME=cost_tracker
   ```

4. ### **Adatbázis beállítása**
   A dokumentációban megjelenített SQL kód kimásolása és feltöltése az adatbázisba

5. **Fejlesztői szerver futtatása**
   ```bash
   npm run dev
   ```

6. **Böngésző megnyitása**
   Navigáljon a [http://localhost:3000](http://localhost:3000) címre

## Használati Útmutató

### 1. Felhasználói Regisztráció és Bejelentkezés
- Látogasson el az alkalmazásba és kattintson a "Regisztráció" gombra új fiók létrehozásához
- Használja email címét és jelszavát a bejelentkezéshez
- A rendszer átirányítja Önt a fő irányítópultra

### 2. Tranzakciók Hozzáadása
- Kattintson az "Új Tranzakció" gombra
- Töltse ki a kötelező mezőket:
  - **Cím**: Tranzakció neve
  - **Összeg**: Tranzakció összege
  - **Típus**: Bevétel vagy Kiadás
  - **Kategória**: Válasszon előre definiált vagy egyedi kategóriák közül
  - **Dátum**: Tranzakció dátuma
  - **Leírás**: Opcionális részletek

### 3. Tranzakciók Kezelése
- **Megtekintés**: Minden tranzakció a fő táblázatban jelenik meg
- **Szerkesztés**: Kattintson a szerkesztés ikonra a tranzakció részletek módosításához
- **Beépített szerkesztés**: Dupla kattintás kategória-, alkategória- vagy leírás cellákra közvetlen szerkesztéshez
- **Üres alkategória létrehozás**: Dupla kattintás üres alkategória cellákra új alkategóriák létrehozásához
- **Törlés**: Kattintson a kuka ikonra a tranzakció eltávolításához
- **Tömeges törlés**: Válasszon ki több tranzakciót és használja a tömeges törlés gombot

### 4. Szűrés és Keresés
- **Dátumtartomány**: Használja a dátumválasztót meghatározott időszakok szűréséhez
- **Típus szűrő**: Szűrés bevétel vagy kiadás szerint
- **Kategória szűrő**: Szűrés meghatározott kategóriák szerint
- **Szöveges keresés**: Keresés tranzakció cím vagy leírás alapján
- **Szűrők törlése**: Minden szűrő visszaállítása egy kattintással

### 5. Adat Exportálás
- **CSV Export**: Kattintson a "CSV Export" gombra a tranzakció adatok letöltéséhez
- **Szelektív Export**: Válasszon ki meghatározott tranzakciókat célzott exportáláshoz
- **Szűrt Export**: Csak szűrt eredmények exportálása

### 6. Testreszabás
- **Oszlop láthatóság**: Használja az "Oszlopok" legördülő menüt a táblázat oszlopok megjelenítéséhez/elrejtéséhez
- **Téma**: Váltás világos és sötét téma között (ha implementálva)

## Fájlstruktúra

```
main-project/
├── app/
│   ├── api/
│   │   ├── auth/           # Hitelesítési végpontok
│   │   ├── categories/     # Kategória kezelés
│   │   ├── transactions/   # Tranzakció CRUD műveletek
│   │   └── subcategories/  # Alkategória kezelés
│   ├── auth/              # Hitelesítési oldalak
│   ├── user/              # Felhasználói profil oldalak
│   ├── layout.tsx         # Fő layout
│   └── page.tsx           # Fő irányítópult
├── components/
│   ├── ui/                # Újrafelhasználható UI komponensek
│   ├── add-transaction-form.tsx
│   ├── transaction-table.tsx
│   ├── chart-area-interactive.tsx
│   └── ...                # Egyéb komponensek
├── lib/
│   ├── db.ts              # Adatbázis kapcsolat
│   └── utils.ts           # Segédfüggvények
├── database-schema.sql    # Adatbázis séma
├── database-migration.sql # Adatbázis migrációk
└── package.json
```

## Biztonsági Funkciók

- **JWT Hitelesítés**: Biztonságos token-alapú hitelesítés
- **Jelszó Hashelés**: Bcrypt titkosítás jelszavakhoz
- **Bemenet Validáció**: Szerveroldali validáció minden bemenethez
- **SQL Injection Megelőzés**: Paraméterezett lekérdezések
- **CORS Védelem**: Beállított CORS szabályok
- **Környezeti Változók**: Érzékeny adatok környezeti változókban tárolva

## Teljesítmény Optimalizációk

- **Adatbázis Indexelés**: Optimalizált adatbázis lekérdezések megfelelő indexekkel
- **Kliensoldali szűrés**: Hatékony szűrés a frontenden
- **Lazy Loading**: Komponensek igény szerinti betöltése
- **Reszponzív dizájn**: Különböző képernyőméretekre optimalizálva
- **Gyorsítótárazás**: Gyakran elért adatok stratégiai gyorsítótárazása

---

**Verzió**: 0.1.0  
**Utolsó frissítés**: 2025. szeptember  
**Technológia**: Next.js 15, TypeScript, MySQL, Tailwind CSS
