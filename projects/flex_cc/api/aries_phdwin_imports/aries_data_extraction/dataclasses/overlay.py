from dataclasses import dataclass
from typing import Optional


@dataclass
class DSTConditions:
    condition_1: bool = False
    condition_2: bool = False
    condition_3: bool = False

    condition_keyword_1: Optional[str] = None
    condition_keyword_2: Optional[str] = None

    condition_phase: Optional[str] = None
    condition_category: Optional[str] = None

    def validate_conditions(self):
        return self.condition_1 and self.condition_2 and self.condition_3

    def reset_conditions(self):
        self.condition_1: bool = False
        self.condition_2: bool = False
        self.condition_3: bool = False

        self.condition_keyword_1: Optional[str] = None
        self.condition_keyword_2: Optional[str] = None

        self.condition_phase: Optional[str] = None
        self.condition_category: Optional[str] = None
