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
    week = {-6: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8}, -5: {"walk": 1, "read": 1, "water": 6},
            -4: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8}, -3: {"read": 1, "no-phone-in-bed": 1, "water": 7},
            -2: {"walk": 1, "read": 1, "water": 8}, -1: {"walk": 1, "read": 1, "no-phone-in-bed": 1, "water": 8},
            0: {"walk": 1, "read": 1, "water": 5}}
    for k, done in week.items():
        days[d(k)] = done
    v["days"] = dict(sorted(days.items()))
    # Started three weeks ago: the app counts from the day it was started, and one with no start
    # and nothing logged opens on Pick your habits (council round 3).
    v["started"] = d(-20)
    write("habit-tracker", v)


def budget() -> None:
    v = start("budget-log")
    # The starting data has no currency (a new budget guesses it from the device and asks). The
    # sample is one household's, in kronor like the notes around it, set five months ago.
    v["currency"] = "kr"
    v["started"] = "2026-06-01"
    # A day-to-day budget of three categories: the stage has room for three rows under "By
    # category", so every category shows and their sums are the card's own "spent of" line
    # (council round 2: three rows of six, and the balances didn't add up to the headline).
    v["categories"] = [{"name": "Groceries", "budget": 4000}, {"name": "Eating out", "budget": 1500}, {"name": "Transport", "budget": 800}]
    v["expenses"] = [
        {"id": "e1", "date": d(-6), "what": "Weekly shop", "category": "Groceries", "amount": 912},
        {"id": "e2", "date": d(-5), "what": "Travel card", "category": "Transport", "amount": 790},
        {"id": "e3", "date": d(-3), "what": "Weekly shop", "category": "Groceries", "amount": 874},
        {"id": "e4", "date": d(-2), "what": "Lunch with Maja", "category": "Eating out", "amount": 185},
        {"id": "e5", "date": d(0), "what": "Coffee and a bun", "category": "Eating out", "amount": 68},
    ]
    # The five months before, so "Last six months" is a chart and not five empty bars: four weekly
    # shops, the travel card and a few meals out each month, July over its budget. Mid-month days,
    # so a week or two of moved dates keeps each in its month; October's first week is a little
    # more than November's, for "121 kr less than October by the 8th".
    months = {
        6: ([880, 905, 842, 931], [340, 285, 410]),
        7: ([920, 1010, 965, 990], [520, 610, 480, 395]),
        8: ([860, 895, 910, 870], [310, 260, 365]),
        9: ([905, 880, 925, 940], [295, 450, 380]),
        10: ([900, 915, 890, 600], [620, 240, 330]),
    }
    n = 0
    for month, (shops, meals) in months.items():
        def on(day: int) -> str:
            return datetime.date(2026, month, day).isoformat()
        rows = [(on(day), "Weekly shop", "Groceries", amount) for day, amount in zip((3, 10, 17, 24), shops)]
        rows.append((on(4), "Travel card", "Transport", 790))
        rows += [(on(day), what, "Eating out", amount) for day, what, amount in zip((6, 13, 20, 27), ("Dinner out", "Lunch out", "Pizza night", "Brunch"), meals)]
        if month == 10:
            rows.append((on(7), "Big shop before guests", "Groceries", 640))
        for date, what, category, amount in sorted(rows):
            n += 1
            v["expenses"].append({"id": f"h{n}", "date": date, "what": what, "category": category, "amount": amount})
    write("budget-log", v)


def flashcards() -> None:
    # (question, answer, topic, days since seen or None for a new card, interval). Due dates spread
    # over the week, so "Coming up" isn't one bar. The last card is the newest: the first screen
    # shows it, question over answer.
    cards = [
        ("Where does glycolysis happen?", "In the cytoplasm", "Cell respiration", 3, 3),
        ("What is ATP for?", "It carries energy the cell can use", "Cell respiration", 2, 6),
        ("What does the Krebs cycle release?", "Carbon dioxide", "Cell respiration", 3, 3),
        ("Where is the electron transport chain?", "The inner membrane of the mitochondria", "Cell respiration", 4, 10),
        ("What does fermentation make in muscles?", "Lactic acid", "Cell respiration", 1, 2),
        ("Where does photosynthesis happen?", "In the chloroplasts", "Photosynthesis", 3, 3),
        ("What do the light reactions make?", "ATP, NADPH and oxygen", "Photosynthesis", 2, 6),
        ("Which pigment absorbs the light?", "Chlorophyll", "Photosynthesis", 2, 3),
        ("What gas do plants give off?", "Oxygen", "Photosynthesis", 1, 3),
        ("What does the Calvin cycle fix?", "Carbon dioxide, into sugar", "Photosynthesis", None, 0),
        ("Which sugar does the cell burn?", "Glucose", "Cell respiration", None, 0),
        ("Which stage makes the most ATP?", "The electron transport chain, in the mitochondria", "Cell respiration", None, 0),
    ]
    out = []
    for i, (q, a, topic, seen, interval) in enumerate(cards):
        c = {"id": f"c{i + 1}", "q": q, "a": a, "topic": topic, "box": 1}
        if seen is not None:
            c.update({"box": 1 if interval <= 1 else 2 if interval <= 3 else 3 if interval <= 7 else 4, "seen": d(-seen), "interval": interval, "ease": 2.5})
        out.append(c)
    # Studied every day this week up to yesterday: a streak shows on the stage (council round 6).
    # Before that, most days of the last seven weeks, so the calendar reads as a habit with gaps
    # in it and not as six squares.
    studied = {d(k): 3 + (k * 7) % 9 for k in range(-52, -7) if (k * 5) % 11 > 2}
    studied.update({d(-6): 8, d(-5): 5, d(-4): 7, d(-3): 10, d(-2): 6, d(-1): 9})
    write("study-flashcards", {"cards": out, "studied": dict(sorted(studied.items()))})


def trip() -> None:
    v = start("trip-plan")
    v["trip"] = {"name": "Lisbon", "place": "Portugal", "start": d(14), "end": d(18)}
    # A booking is a line of its day's timeline already, so the plan never says it again (council
    # round 2: "16:00 Check in" over "16:00 Flat in Alfama", and dinner twice at 20:00). Every
    # line of the first day has its time, in order.
    v["days"] = [
        {"date": d(14), "title": "Arrive in Alfama", "items": ["14:30 Land and take the metro to Baixa", "17:30 Walk up to Miradouro de Santa Luzia", "20:00 Dinner at Taberna da Rua das Flores"]},
        {"date": d(15), "title": "Belém", "items": ["09:30 Tram 15 to Belém", "Pastéis de Belém", "The monastery cloisters", "Sunset on the river"]},
        {"date": d(16), "title": "Sintra", "items": ["09:00 Train from Rossio", "13:00 Lunch in the old town", "Quinta da Regaleira if there's time"]},
        {"date": d(17), "title": "Markets and views", "items": ["Time Out Market for lunch", "LX Factory", "Miradouro da Graça at dusk"]},
        {"date": d(18), "title": "Home", "items": ["Coffee at A Brasileira", "12:00 Check out"]},
    ]
    # The one still to pay is a ticket you buy ahead, not a restaurant table.
    v["bookings"] = [
        {"id": "b1", "what": "Flight to Lisbon", "kind": "flight", "date": d(14), "time": "11:05", "paid": True},
        {"id": "b2", "what": "Check in: flat in Alfama, 4 nights", "kind": "stay", "date": d(14), "time": "16:00", "paid": True},
        {"id": "b3", "what": "Pena Palace tickets", "kind": "activity", "date": d(16), "time": "10:30", "paid": False},
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
