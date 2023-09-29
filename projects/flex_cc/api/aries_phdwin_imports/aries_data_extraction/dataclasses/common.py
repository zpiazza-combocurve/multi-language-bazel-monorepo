from dataclasses import dataclass, field
from typing import List


@dataclass
class Economic:
    keyword: str
    propnum: str
    original_keyword: str
    expression: str
    qualifier: str
    section: str
    sequence: str
    ls_expression: List[str] = field(default_factory=list)

    def __str__(self):
        return f"{' '.join(self.ls_expression)} {self.keyword}"
