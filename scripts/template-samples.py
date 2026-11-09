#!/usr/bin/env python3
"""The Mac template library's sample data for each template app (Pane/Resources/Templates/
template-app-<slug>.sample.json): the app in use, shown on the library's stage, in its picture and
in the live app that replaces it. Make never adds it: Make adds the starting data (.data.json).
(Council round 4: the stage showed "0 of 4 done today", "No trip yet" and "0 kr spent".)

Every date is written for ANCHOR. The app (TemplateFiles.sample) and scripts/template-stage-pictures.ts
move each "yyyy-mm-dd" by today less ANCHOR, so a habit ticked "today" is ticked today.
  python3 scripts/template-samples.py   (then deno run -A scripts/template-stage-pictures.ts)
"""
import datetime
import json
from pathlib import Path

ANCHOR = datetime.date(2026, 11, 8)
OUT = Path(__file__).resolve().parent.parent / "Pane/Resources/Templates"


def d(n: int) -> str:
    return (ANCHOR + datetime.timedelta(days=n)).isoformat()


def start(slug: str) -> dict:
    return json.loads((OUT / f"template-app-{slug}.data.json").read_text())["values"]


def write(slug: str, values: dict) -> None:
    (OUT / f"template-app-{slug}.sample.json").write_text(json.dumps({"values": values, "collections": {}}, ensure_ascii=False, indent=1) + "\n")


def habits() -> None:
    v = start("habit-tracker")
    days = {}
    for k in range(-20, -6):
        days[d(k)] = {"walk": 1, "read": 1, "water": 8} if k % 3 else {"walk": 1, "no-phone-in-bed": 1, "water": 6}
    week = {-6: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8}, -5: {"walk": 1, "water": 6},
            -4: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8}, -3: {"read": 1, "no-phone-in-bed": 1, "water": 7},
            -2: {"walk": 1, "read": 1, "water": 8}, -1: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8},
            0: {"walk": 1, "read": 1, "water": 5}}
    for k, done in week.items():
        days[d(k)] = done
    v["days"] = dict(sorted(days.items()))
    write("habit-tracker", v)


def budget() -> None:
    v = start("budget-log")
    v["expenses"] = [
        {"id": "e1", "date": d(-7), "what": "Rent share", "category": "Bills", "amount": 3200},
        {"id": "e2", "date": d(-6), "what": "Weekly shop", "category": "Groceries", "amount": 912},
        {"id": "e3", "date": d(-5), "what": "Travel card", "category": "Transport", "amount": 790},
        {"id": "e4", "date": d(-4), "what": "Lunch with Sara", "category": "Eating out", "amount": 185},
        {"id": "e5", "date": d(-3), "what": "Cinema", "category": "Fun", "amount": 260},
        {"id": "e6", "date": d(-2), "what": "Weekly shop", "category": "Groceries", "amount": 874},
        {"id": "e7", "date": d(-1), "what": "Light bulbs and a plant", "category": "Home", "amount": 349},
        {"id": "e8", "date": d(0), "what": "Coffee and a bun", "category": "Eating out", "amount": 68},
    ]
    write("budget-log", v)


def flashcards() -> None:
    cards = [
        ("Where does glycolysis happen?", "In the cytoplasm", "Cell respiration"),
        ("Which stage makes the most ATP?", "The electron transport chain", "Cell respiration"),
        ("What is ATP for?", "It carries energy the cell can use", "Cell respiration"),
        ("What does the Krebs cycle release?", "Carbon dioxide", "Cell respiration"),
        ("Where is the electron transport chain?", "The inner membrane of the mitochondria", "Cell respiration"),
        ("What does fermentation make in muscles?", "Lactic acid", "Cell respiration"),
        ("Where does photosynthesis happen?", "In the chloroplasts", "Photosynthesis"),
        ("What do the light reactions make?", "ATP, NADPH and oxygen", "Photosynthesis"),
        ("What does the Calvin cycle fix?", "Carbon dioxide, into sugar", "Photosynthesis"),
        ("Which pigment absorbs the light?", "Chlorophyll", "Photosynthesis"),
        ("What gas do plants give off?", "Oxygen", "Photosynthesis"),
        ("Which sugar does the cell burn?", "Glucose", "Cell respiration"),
    ]
    out = []
    for i, (q, a, topic) in enumerate(cards):
        c = {"id": f"c{i + 1}", "q": q, "a": a, "topic": topic, "box": 1}
        if i in (2, 4, 7, 9):  # studied two days ago, not due for a while
            c.update({"box": 3, "seen": d(-2), "interval": 6, "ease": 2.5})
        elif i in (0, 1, 6, 10):  # due today
            c.update({"box": 2, "seen": d(-3), "interval": 3, "ease": 2.5})
        out.append(c)
    # Studied every day this week up to yesterday: a streak shows on the stage (council round 6).
    write("study-flashcards", {"cards": out, "studied": {d(-6): 8, d(-5): 5, d(-4): 7, d(-3): 10, d(-2): 6, d(-1): 9}})


def trip() -> None:
    v = start("trip-plan")
    v["trip"] = {"name": "Lisbon", "place": "Portugal", "start": d(14), "end": d(18)}
    v["days"] = [
        {"date": d(14), "title": "Arrive in Alfama", "items": ["14:30 Land and take the metro to Baixa", "16:00 Check in", "Walk up to Miradouro de Santa Luzia", "20:00 Dinner at Taberna da Rua das Flores"]},
        {"date": d(15), "title": "Belém", "items": ["09:30 Tram 15 to Belém", "Pastéis de Belém", "The monastery cloisters", "Sunset on the river"]},
        {"date": d(16), "title": "Sintra", "items": ["09:00 Train from Rossio", "Pena Palace gardens", "Lunch in the old town"]},
        {"date": d(17), "title": "Markets and views", "items": ["Time Out Market for lunch", "LX Factory", "Miradouro da Graça at dusk"]},
        {"date": d(18), "title": "Home", "items": ["Coffee at A Brasileira", "12:00 Check out", "15:40 Fly home"]},
    ]
    v["bookings"] = [
        {"id": "b1", "what": "Flight to Lisbon", "kind": "flight", "date": d(14), "time": "11:05", "paid": True},
        {"id": "b2", "what": "Flat in Alfama, 4 nights", "kind": "stay", "date": d(14), "time": "16:00", "paid": True},
        {"id": "b3", "what": "Taberna da Rua das Flores", "kind": "food", "date": d(14), "time": "20:00", "paid": False},
        {"id": "b4", "what": "Flight home", "kind": "flight", "date": d(18), "time": "15:40", "paid": True},
    ]
    for p in v["packing"]:
        if p["id"] in ("p1", "p4", "p5"):
            p["packed"] = True
    write("trip-plan", v)


habits()
budget()
flashcards()
trip()
print("wrote", ", ".join(sorted(p.name for p in OUT.glob("*.sample.json"))))
