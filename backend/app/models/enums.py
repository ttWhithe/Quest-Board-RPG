import enum


class QuestRank(str, enum.Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"


class QuestRarity(str, enum.Enum):
    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"


class QuestStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class QuestRecurrence(str, enum.Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"


class EventKind(str, enum.Enum):
    birthday = "birthday"
    holiday = "holiday"
    reminder = "reminder"
    custom = "custom"
