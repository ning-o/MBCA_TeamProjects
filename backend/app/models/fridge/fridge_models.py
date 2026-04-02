from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSON, Text, CHAR, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class RefAdmin(Base):
    __tablename__ = 'ref_admin'
    
    admin_no = Column(Integer, primary_key=True, autoincrement=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    inven_id = Column(Integer, ForeignKey('refrigerator.inven_id'), nullable=False)
    refrigerator = relationship("Refrigerator", back_populates="admins")


class Refrigerator(Base):
    __tablename__ = 'refrigerator'
    
    inven_id = Column(Integer, primary_key=True, autoincrement=True)
    inven_nickname = Column(String(30))
    mounth_food_exp = Column(Integer, default=0)
    current_spent = Column(Integer, nullable=False, default=0)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    ingredients = relationship(
        "RefIngredients",
        back_populates="refrigerator",
        cascade="all, delete-orphan"
    )
    admins = relationship(
        "RefAdmin",
        back_populates="refrigerator",
        cascade="all, delete-orphan"
    )


class Pantry(Base):
    __tablename__ = 'pantry'
    
    ingredient_id = Column(Integer, primary_key=True)
    category = Column(String(20), nullable=False)
    ingredient_name = Column(String(10), nullable=False)
    storage_code = Column(Integer, nullable=False)
    expiry_date = Column(Integer, nullable=False)

    ref_ingredients = relationship(
        "RefIngredients",
        back_populates="pantry"
    )
    purchase_infos = relationship(
        "PurchaseInfo",
        back_populates="pantry"
    )
    recipe_ingredients = relationship(
        "RecipeIngredients",
        back_populates="pantry"
    )


class RefIngredients(Base):
    __tablename__ = 'ref_ingredients'
    
    ref_no = Column(Integer, primary_key=True, autoincrement=True)
    inven_id = Column(Integer, ForeignKey('refrigerator.inven_id'), nullable=False)
    ingredient_id = Column(Integer, ForeignKey('pantry.ingredient_id'), nullable=False)
    storage_type = Column(CHAR(1), nullable=False)
    d_days = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    phurchase_date = Column(Date, nullable=False)

    refrigerator = relationship("Refrigerator", back_populates="ingredients")
    pantry = relationship("Pantry", back_populates="ref_ingredients")


class PhurchaseInfo(Base):
    __tablename__ = 'phurchase_info'
    
    phurchase_id = Column(Integer, primary_key=True, autoincrement=True)
    raw_item_name = Column(JSON, nullable=False)
    matched_ingredient_id = Column(Integer, ForeignKey('pantry.ingredient_id'), nullable=True)
    quantity_bill = Column(Integer, nullable=False)
    after_price = Column(Integer, nullable=False)
    phurchase_date = Column(Date, nullable=False)

    pantry = relationship("Pantry", back_populates="purchase_infos")


class Recipe(Base):
    __tablename__ = 'recipe'
    
    recipe_id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_name = Column(String(50), nullable=False)
    difficulty = Column(Integer, nullable=False)
    cooking_time = Column(Integer, nullable=False)
    category = Column(String(20))

    __table_args__ = (
        Index('idx_recipe_name', 'recipe_name'),
    )

    recipe_ingredients = relationship(
        "RecipeIngredients",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )


class RecipeIngredients(Base):
    __tablename__ = 'recipe_ingredients'
    
    no = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey('recipe.recipe_id'), nullable=False)
    ingredient_id = Column(Integer, ForeignKey('pantry.ingredient_id'), nullable=False)
    required_quantity = Column(Integer, nullable=True)
    main_ingredients = Column(Text, nullable=False)
    sub_ingredients = Column(Text, nullable=True)
    Seasonings = Column(Text, nullable=True)

    recipe = relationship("Recipe", back_populates="recipe_ingredients")
    pantry = relationship("Pantry", back_populates="recipe_ingredients")