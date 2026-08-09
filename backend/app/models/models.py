from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Season(Base):
    __tablename__ = "seasons"

    year = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=True)

    races = relationship("Race", back_populates="season")

class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(String, primary_key=True, index=True)
    permanent_number = Column(String, nullable=True)
    code = Column(String, nullable=True)
    given_name = Column(String, nullable=False)
    family_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    nationality = Column(String, nullable=True)

    results = relationship("Result", back_populates="driver")
    laps = relationship("SessionLap", back_populates="driver")
    standings = relationship("Standing", back_populates="driver")

class Constructor(Base):
    __tablename__ = "constructors"

    constructor_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    nationality = Column(String, nullable=True)

    results = relationship("Result", back_populates="constructor")

class Race(Base):
    __tablename__ = "races"

    race_id = Column(String, primary_key=True, index=True)
    season_year = Column(Integer, ForeignKey("seasons.year"), nullable=False)
    round = Column(Integer, nullable=False)
    race_name = Column(String, nullable=False)
    circuit_name = Column(String, nullable=True)
    date = Column(String, nullable=True)

    season = relationship("Season", back_populates="races")
    results = relationship("Result", back_populates="race")
    laps = relationship("SessionLap", back_populates="race")

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    race_id = Column(String, ForeignKey("races.race_id"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.driver_id"), nullable=False)
    constructor_id = Column(String, ForeignKey("constructors.constructor_id"), nullable=False)
    number = Column(Integer, nullable=True)
    position = Column(Integer, nullable=True)
    points = Column(Float, nullable=True)
    grid = Column(Integer, nullable=True)
    laps = Column(Integer, nullable=True)
    status = Column(String, nullable=True)

    race = relationship("Race", back_populates="results")
    driver = relationship("Driver", back_populates="results")
    constructor = relationship("Constructor", back_populates="results")

class Standing(Base):
    """End-of-season driver championship standing, one row per driver per season."""
    __tablename__ = "standings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    season_year = Column(Integer, ForeignKey("seasons.year"), nullable=False, index=True)
    driver_id = Column(String, ForeignKey("drivers.driver_id"), nullable=False, index=True)
    constructor_id = Column(String, ForeignKey("constructors.constructor_id"), nullable=True)
    position = Column(Integer, nullable=True)
    points = Column(Float, nullable=True)
    wins = Column(Integer, nullable=True)

    driver = relationship("Driver", back_populates="standings")
    constructor = relationship("Constructor")
    season = relationship("Season")

class SessionLap(Base):
    __tablename__ = "session_laps"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    race_id = Column(String, ForeignKey("races.race_id"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.driver_id"), nullable=False)
    lap_number = Column(Integer, nullable=False)
    lap_time_seconds = Column(Float, nullable=True)
    tyre_compound = Column(String, nullable=True)
    stint = Column(Integer, nullable=True)

    race = relationship("Race", back_populates="laps")
    driver = relationship("Driver", back_populates="laps")
