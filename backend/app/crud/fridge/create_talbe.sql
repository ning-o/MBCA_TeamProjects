SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipe;
DROP TABLE IF EXISTS phurchase_info;
DROP TABLE IF EXISTS ref_ingredients;
DROP TABLE IF EXISTS ref_admin;
DROP TABLE IF EXISTS pantry;
DROP TABLE IF EXISTS refrigerator;

SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE refrigerator (
    inven_id INT AUTO_INCREMENT PRIMARY KEY,
    inven_nickname VARCHAR(30),
    mounth_food_exp INT DEFAULT 0,
    current_spent INT NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    CONSTRAINT fk_refrigerator_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE pantry (
    ingredient_id INT PRIMARY KEY,
    category VARCHAR(30) NOT NULL,
    ingredient_name VARCHAR(30) NOT NULL,
    storage_code INT NOT NULL,
    expiry_date INT NOT NULL
);


CREATE TABLE ref_admin (
    admin_no INT AUTO_INCREMENT PRIMARY KEY,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INT NOT NULL,
    inven_id INT NOT NULL,
    CONSTRAINT fk_ref_admin_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ref_admin_refrigerator
        FOREIGN KEY (inven_id) REFERENCES refrigerator(inven_id)
);


CREATE TABLE ref_ingredients (
    ref_no INT AUTO_INCREMENT PRIMARY KEY,
    inven_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    storage_type CHAR(1) NOT NULL,
    d_days DATE NOT NULL,
    quantity INT NOT NULL,
    phurchase_date DATE NOT NULL,
    CONSTRAINT fk_ref_ingredients_refrigerator
        FOREIGN KEY (inven_id) REFERENCES refrigerator(inven_id),
    CONSTRAINT fk_ref_ingredients_pantry
        FOREIGN KEY (ingredient_id) REFERENCES pantry(ingredient_id)
);


CREATE TABLE phurchase_info (
    phurchase_id INT AUTO_INCREMENT PRIMARY KEY,
    raw_item_name JSON NOT NULL,
    matched_ingredient_id INT NULL,
    quantity_bill INT NOT NULL,
    after_price INT NOT NULL,
    phurchase_date DATE NOT NULL,
    CONSTRAINT fk_phurchase_info_pantry
        FOREIGN KEY (matched_ingredient_id) REFERENCES pantry(ingredient_id)
);


CREATE TABLE recipe (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(50) NOT NULL,
    difficulty INT NOT NULL,
    cooking_time INT NOT NULL,
    category VARCHAR(30),
    INDEX idx_recipe_name (recipe_name)
);


CREATE TABLE recipe_ingredients (
    no INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    required_quantity INT NULL,
    main_ingredients TEXT NOT NULL,
    sub_ingredients TEXT NULL,
    Seasonings TEXT NULL,
    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id),
    CONSTRAINT fk_recipe_ingredients_pantry
        FOREIGN KEY (ingredient_id) REFERENCES pantry(ingredient_id)
);