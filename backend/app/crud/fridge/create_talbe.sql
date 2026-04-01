CREATE TABLE ref_admin(
    admin_no INT AUTO_INCREMENT PRIMARY KEY,
    is_admin BOOLEAN NOT NULL,
    user_id INT NOT NULL,
    inven_id INT NOT NULL,
    CONSTRAINT fk_ref_admin_users Foreign Key (user_id) REFERENCES users(id)
);

CREATE TABLE refrigerator(
    nick_name VARCHAR(30) NOT NULL,
    inven_id INT AUTO_INCREMENT PRIMARY KEY,
    inven_nickname VARCHAR(30),
    mounth_food_exp INT,
    current_spent INT NOT NULL,
    CONSTRAINT fk_refrigerator_users Foreign Key (nick_name) REFERENCES users(nick_name)
);
CREATE TABLE pantry (
    ingredient_id INT PRIMARY KEY, 
    category VARCHAR(20) NOT NULL,         
    ingredient_name VARCHAR(10) NOT NULL, 
    storage_code INT NOT NULL,             
    expiry_date INT NOT NULL               
);

CREATE TABLE ref_ingredients(
    ref_no INT AUTO_INCREMENT PRIMARY key,
    inven_id INT ,
    ingredient_id INT NOT NULL,
    storage_type CHAR(1) NOT NULL,
    d_days DATE NOT NULL,
    quantity INT NOT NULL,
    phurchase_date DATE NOT NULL,
    CONSTRAINT fk_ref_ingredients_refrigerator Foreign Key (inven_id) REFERENCES refrigerator(inven_id),
    CONSTRAINT fk_ref_ingredients_pantry Foreign Key (ingredient_id) REFERENCES pantry(ingredient_id)
);

CREATE TABLE phurchase_info(
    phurchase_id INT PRIMARY KEY,
    raw_item_name JSON NOT NULL,
    matched_ingredient_id INT NOT NULL,
    quantity_bill INT NOT NULL,
    after_price INT NOT NULL,
    phurchase_date DATE NOT NULL,
    CONSTRAINT fk_phurchase_info_pantry Foreign Key (matched_ingredient_id) REFERENCES pantry(ingredient_id)
);

CREATE TABLE recipe(
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(50) NOT NULL, 
    difficulty INT NOT NULL,
    cooking_time INT NOT NULL,
    category VARCHAR(20),
    INDEX(recipe_name)
);

CREATE TABLE recipe_ingredients (
    no INT AUTO_INCREMENT PRIMARY KEY,    
    recipe_id INT NOT NULL,                   
    ingredient_id INT NOT NULL,            
    required_quantity INT,  
    main_ingredients TEXT NOT NULL,  
    sub_ingredients TEXT ,   
    Seasonings TEXT ,     
    CONSTRAINT fk_RecipeIngredients_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id),
    CONSTRAINT fk_RecipeIngredients_pantry FOREIGN KEY (ingredient_id) REFERENCES Pantry(ingredient_id)
);

