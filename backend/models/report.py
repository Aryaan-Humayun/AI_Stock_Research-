from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func

from database import Base


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    report_text = Column(Text, nullable=False)
    risk_score = Column(Integer, nullable=True)
    opportunities = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
