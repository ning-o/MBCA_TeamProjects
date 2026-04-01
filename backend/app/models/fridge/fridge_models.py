from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSON, Text, CHAR, Index
from sqlalchemy.orm import relationship
from app.core.database import Base  # 보통 database.py에서 Base = declarative_base()를 가져옵니다.

class RefAdmin(Base):
    __tablename__ = 'ref_admin'
    
    admin_no = Column(Integer, primary_key=True, autoincrement=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    inven_id = Column(Integer, nullable=False)

class Refrigerator(Base):
    __tablename__ = 'refrigerator'
    
    inven_id = Column(Integer, primary_key=True, autoincrement=True)
    nick_name = Column(String(30), ForeignKey('users.nick_name'), nullable=False)
    inven_nickname = Column(String(30))
    mounth_food_exp = Column(Integer, default=0)
    current_spent = Column(Integer, nullable=False, default=0)

    # 관계 설정 (필요 시)
    ingredients = relationship("RefIngredients", back_populates="refrigerator")

class Pantry(Base):
    __tablename__ = 'pantry'
    
    ingredient_id = Column(Integer, primary_key=True) # SQL에 따라 수동 ID 입력
    category = Column(String(20), nullable=False)
    ingredient_name = Column(String(10), nullable=False)
    storage_code = Column(Integer, nullable=False)
    expiry_date = Column(Integer, nullable=False)

class RefIngredients(Base):
    __tablename__ = 'ref_ingredients'
    
    ref_no = Column(Integer, primary_key=True, autoincrement=True)
    inven_id = Column(Integer, ForeignKey('refrigerator.inven_id'))
    ingredient_id = Column(Integer, ForeignKey('pantry.ingredient_id'), nullable=False)
    storage_type = Column(CHAR(1), nullable=False)
    d_days = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    phurchase_date = Column(Date, nullable=False)

    refrigerator = relationship("Refrigerator", back_populates="ingredients")

class PurchaseInfo(Base):
    __tablename__ = 'phurchase_info'
    
    phurchase_id = Column(Integer, primary_key=True)
    raw_item_name = Column(JSON, nullable=False)
    matched_ingredient_id = Column(Integer, ForeignKey('pantry.ingredient_id'), nullable=False)
    quantity_bill = Column(Integer, nullable=False)
    after_price = Column(Integer, nullable=False)
    phurchase_date = Column(Date, nullable=False)

class Recipe(Base):
    __tablename__ = 'recipe'
    
    recipe_id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_name = Column(String(50), nullable=False)
    difficulty = Column(Integer, nullable=False)
    cooking_time = Column(Integer, nullable=False)
    category = Column(String(20))

    # 레시피 이름으로 검색이 많으므로 인덱스 설정
    __table_args__ = (
        Index('idx_recipe_name', 'recipe_name'),
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