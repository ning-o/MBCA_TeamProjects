from common import db  # 보통 common.py에 db = SQLAlchemy()가 있다고 가정합니다.
from datetime import datetime

class RefAdmin(db.Model):
    __tablename__ = 'ref_admin'
    admin_no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    is_admin = db.Column(db.Boolean, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    inven_id = db.Column(db.Integer, nullable=False)

class Refrigerator(db.Model):
    __tablename__ = 'refrigerator'
    inven_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nick_name = db.Column(db.String(30), db.ForeignKey('users.nick_name'), nullable=False)
    inven_nickname = db.Column(db.String(30))
    mounth_food_exp = db.Column(db.Integer)
    current_spent = db.Column(db.Integer, nullable=False)

class Pantry(db.Model):
    __tablename__ = 'pantry'
    ingredient_id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(10), nullable=False)
    ingredient_name = db.Column(db.String(10), nullable=False)
    storage_code = db.Column(db.Integer, nullable=False)
    expiry_date = db.Column(db.Integer, nullable=False)

class RefIngredients(db.Model):
    __tablename__ = 'ref_ingredients'
    ref_no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    inven_id = db.Column(db.Integer, db.ForeignKey('refrigerator.inven_id'))
    ingredient_id = db.Column(db.Integer, db.ForeignKey('pantry.ingredient_id'), nullable=False)
    storage_type = db.Column(db.String(1), nullable=False)
    d_days = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    phurchase_date = db.Column(db.Date, nullable=False)

class PurchaseInfo(db.Model):
    __tablename__ = 'phurchase_info'
    phurchase_id = db.Column(db.Integer, primary_key=True)
    raw_item_name = db.Column(db.JSON, nullable=False)
    matched_ingredient_id = db.Column(db.Integer, db.ForeignKey('pantry.ingredient_id'), nullable=False)
    quantity_bill = db.Column(db.Integer, nullable=False)
    after_price = db.Column(db.Integer, nullable=False)
    phurchase_date = db.Column(db.Date, nullable=False)

class Recipe(db.Model):
    __tablename__ = 'recipe'
    recipe_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    recipe_name = db.Column(db.String(50), nullable=False, index=True)
    difficulty = db.Column(db.String(30), nullable=False)
    cooking_time = db.Column(db.String(10), nullable=False)
    category = db.Column(db.String(20), nullable=False)

class RecipeIngredients(db.Model):
    __tablename__ = 'recipe_ingredients'
    no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.recipe_id'), nullable=False)
    ingredient_id = db.Column(db.Integer, db.ForeignKey('pantry.ingredient_id'), nullable=False)
    required_quantity = db.Column(db.Integer, nullable=False)
    main_ingredients = db.Column(db.Text, nullable=False)
    sub_ingredients = db.Column(db.Text, nullable=False)
    seasonings = db.Column(db.Text, nullable=False)