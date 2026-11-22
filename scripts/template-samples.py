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
    # In use, all four are the person's habits: no suggestion marks ("pick" is the first screen's).
    for h in v["habits"]:
        h.pop("pick", None)
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
    # Four nights in Lisbon: the documents and the shoes are in the bag, the rest isn't yet.
    for p in v["packing"]:
        if p["id"] in ("p1", "p4", "p5", "p6"):
            p["packed"] = True
    write("trip-plan", v)


def home() -> None:
    v = start("home-maintenance")
    v["currency"] = "kr"
    # A house near Stockholm, a year in. The phone numbers are in the range set aside for fiction.
    v["contacts"] = [
        {"id": "c1", "name": "Värme & Rör AB", "trade": "Heating engineer", "phone": "08-465 004 51"},
        {"id": "c2", "name": "Nordin & Son", "trade": "Plumber", "phone": "08-465 004 27"},
        {"id": "c3", "name": "Volt Fix", "trade": "Electrician", "phone": "08-465 004 63"},
        {"id": "c4", "name": "Sotarn i Söder", "trade": "Chimney sweep", "phone": "08-465 004 88"},
        {"id": "c5", "name": "Däckcentralen", "trade": "Tyres", "phone": "08-465 004 19"},
    ]
    # (id, name, area, every, contact, usual cost, the days it was done (before ANCHOR), the cost and
    # note of each). Two are late (the smoke alarms, the shower drain), the gutters are due this
    # autumn, two filters come due in the next week or so, and the rest are coming up.
    jobs = [
        ("j1", "Test the smoke alarms", "Safety", "6 months", None, None, [(-200, 89, "New battery in the hall")]),
        ("j2", "Clean the dishwasher filter", "Kitchen", "1 month", None, None, [(-n, None, None) for n in (25, 56, 86, 118, 149, 180, 212, 240, 272, 303, 333)]),
        ("j3", "Clean the extractor fan filter", "Kitchen", "3 months", None, 249, [(-85, 249, None), (-176, 249, None), (-268, 249, "Bought two spares")]),
        ("j4", "Clean the shower drain", "Bathroom", "3 months", None, None, [(-100, None, None), (-192, None, None), (-290, None, "Hair catcher fitted")]),
        ("j5", "Clean the washing machine filter", "Bathroom", "3 months", None, None, [(-40, None, None), (-131, None, None), (-222, None, None), (-315, None, None)]),
        ("j6", "Service the heat pump", "Heating", "1 year", "c1", 1450, [(-300, 1450, "New filter, pressure fine")]),
        ("j7", "Bleed the radiators", "Heating", "autumn", None, None, [(-390, None, None)]),
        ("j8", "Sweep the chimney", "Heating", "1 year", "c4", 650, [(-200, 650, None)]),
        ("j9", "Clear the gutters", "Outside", "autumn", None, None, [(-375, None, "Two downpipes blocked")]),
        ("j10", "Oil the deck", "Outside", "summer", None, 640, [(-120, 640, "Two coats, 3 litres")]),
        ("j11", "Prune the apple tree", "Garden", "winter", None, None, [(-290, None, None)]),
        ("j12", "Service the lawnmower", "Garden", "spring", None, 450, [(-215, 450, None)]),
        ("j13", "Switch to winter tyres", "Car", "autumn", "c5", 500, [(-26, 500, None)]),
        ("j14", "Switch to summer tyres", "Car", "spring", "c5", 500, [(-205, 500, None)]),
        ("j15", "Service the car", "Car", "1 year", None, 3200, [(-250, 3200, "Front brake pads too")]),
        ("j16", "Check the fire extinguisher", "Safety", "1 year", None, None, [(-330, None, None)]),
    ]
    v["jobs"], v["history"] = [], []
    for jid, name, area, every, contact, cost, done in jobs:
        j = {"id": jid, "name": name, "area": area, "every": every, "last": d(max(n for n, _, _ in done))}
        if contact:
            j["contact"] = contact
        if cost is not None:
            j["cost"] = cost
        v["jobs"].append(j)
        for n, c, note in done:
            h = {"id": f"h{len(v['history']) + 1}", "job": jid, "date": d(n)}
            if c is not None:
                h["cost"] = c
            if note:
                h["note"] = note
            v["history"].append(h)
    v["history"].sort(key=lambda h: h["date"])
    # The dishwasher's warranty ends in a month: the app flags it.
    v["appliances"] = [
        {"id": "a1", "name": "Dishwasher", "area": "Kitchen", "model": "Bosch Serie 4 SMV4HCX48E", "serial": "FD 9912 00341", "bought": d(-700), "warranty": d(30), "manual": "https://www.bosch-home.com/se/service/bruksanvisningar"},
        {"id": "a2", "name": "Heat pump", "area": "Heating", "model": "Nibe F2120-12", "serial": "06 5432 1188", "bought": "2021-09-14", "warranty": "2027-09-14", "manual": "https://www.nibe.eu/en-eu/support/manuals"},
        {"id": "a3", "name": "Washing machine", "area": "Bathroom", "model": "Miele WWD 320", "serial": "000 1182 7764", "bought": d(-500), "warranty": d(600)},
        {"id": "a4", "name": "Fridge freezer", "area": "Kitchen", "model": "Electrolux LNT7ME34X2", "bought": d(-1100), "warranty": d(-370)},
        {"id": "a5", "name": "Lawnmower", "area": "Garden", "model": "Husqvarna LC 247", "bought": "2022-05-02"},
    ]
    v["details"] = [
        {"id": "i1", "name": "Water stopcock", "value": "Under the kitchen sink, turn clockwise to close"},
        {"id": "i2", "name": "Fuse box", "value": "Hall cupboard, top shelf. Main switch on the left"},
        {"id": "i3", "name": "Heat pump settings", "value": "Curve 5, offset -1"},
        {"id": "i4", "name": "Living room paint", "value": "Jotun Lady 1024 Tidløs, matt"},
        {"id": "i5", "name": "Long ladder", "value": "In the garage, behind the bikes"},
    ]
    write("home-maintenance", v)


habits()
budget()
flashcards()
trip()
home()
print("wrote", ", ".join(sorted(p.name for p in OUT.glob("*.sample.json"))))
