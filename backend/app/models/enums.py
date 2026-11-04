from enum import StrEnum


class QuestRank(StrEnum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"


class QuestRarity(StrEnum):
    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"


class QuestStatus(StrEnum):
    active = "active"
    completed = "completed"
    archived = "archived"


class QuestRecurrence(StrEnum):
    none = "none"
    daily = "daily"
    weekly = "weekly"


class EventKind(StrEnum):
    birthday = "birthday"
    holiday = "holiday"
    reminder = "reminder"
    custom = "custom"
