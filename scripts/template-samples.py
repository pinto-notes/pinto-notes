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


def meals() -> None:
    v = start("meal-plan")
    FV, BA, MF, DE, DG, TJ, FR, OT = v["aisles"]
    v["cooks"] = ["Me", "Oskar"]

    def i(name: str, qty: str | None, aisle: str) -> dict:
        return {"name": name, **({"qty": qty} if qty else {}), "aisle": aisle}
    # (dish, cook, recipe, ingredients). Dinners on every day from six days back to six ahead, so
    # whatever weekday the picture is drawn on, the week it shows is planned from Monday to Sunday
    # (the dates move to the day it's drawn). Things two dinners share (lemons, basil, peppers,
    # tortillas) make one line, and the rice, onions and garlic are in the cupboard.
    plan = [
        ("Lemon chicken with rice", "Me", "Recipes/Lemon chicken", [i("Chicken thighs", "600 g", MF), i("Lemons", "2", FV), i("Rice", None, DG), i("Parsley", "1 bunch", FV)]),
        ("Fish tacos", "Oskar", None, [i("White fish", "400 g", MF), i("Limes", "2", FV), i("Tortillas", "8", BA), i("Red cabbage", "1", FV), i("Sour cream", "1 tub", DE)]),
        ("Chickpea curry", "Oskar", "Recipes/Chickpea curry", [i("Chickpeas", "2 tins", TJ), i("Coconut milk", "1 tin", TJ), i("Spinach", "200 g", FV), i("Onions", None, FV), i("Rice", None, DG)]),
        ("Pasta with tomato and basil", "Me", None, [i("Pasta", None, DG), i("Cherry tomatoes", "500 g", FV), i("Basil", "1 bunch", FV), i("Parmesan", None, DE)]),
        ("Homemade pizza", "Me", "Recipes/Pizza dough", [i("Pizza dough", "2", BA), i("Mozzarella", "2", DE), i("Passata", "1 jar", TJ), i("Basil", "1 bunch", FV)]),
        ("Out with friends", None, None, []),
        ("Roast chicken and potatoes", "Oskar", "Recipes/Roast chicken", [i("Whole chicken", None, MF), i("Potatoes", "1 kg", FV), i("Lemon", "1", FV), i("Garlic", None, FV)]),
        ("Miso salmon with greens", "Me", None, [i("Salmon fillets", "2", MF), i("Broccoli", "1", FV), i("Miso paste", None, TJ), i("Rice", None, DG)]),
        ("Shakshuka", "Oskar", None, [i("Eggs", "6", DE), i("Tinned tomatoes", "2 tins", TJ), i("Peppers", "2", FV), i("Sourdough", "1 loaf", BA)]),
        ("Red lentil soup", "Me", None, [i("Red lentils", "300 g", DG), i("Carrots", "3", FV), i("Onions", None, FV), i("Sourdough", "1 loaf", BA)]),
        ("Halloumi wraps", "Oskar", None, [i("Halloumi", "1", DE), i("Tortillas", "8", BA), i("Peppers", "1", FV), i("Hummus", "1 tub", DE)]),
        ("Pesto gnocchi", "Me", None, [i("Gnocchi", "500 g", OT), i("Pesto", "1 jar", TJ), i("Cherry tomatoes", "250 g", FV)]),
        ("Burgers", "Oskar", None, [i("Beef mince", "500 g", MF), i("Burger buns", "4", BA), i("Lettuce", "1", FV), i("Cheddar", None, DE)]),
    ]
    earlier = [
        ("Fish pie", "Me", None, [i("White fish", "400 g", MF), i("Potatoes", "1 kg", FV), i("Milk", "1 l", DE), i("Peas", "1 bag", FR)]),
        ("Veggie stir fry", "Oskar", None, [i("Noodles", "2 packs", DG), i("Broccoli", "1", FV), i("Peppers", "1", FV), i("Soy sauce", None, TJ)]),
    ]
    v["dinners"] = []
    for n, (dish, cook, recipe, ingredients) in [(-9, earlier[0]), (-8, earlier[1])] + list(zip(range(-6, 7), plan)):
        din = {"id": f"d{len(v['dinners']) + 1}", "date": d(n), "dish": dish}
        if cook:
            din["cook"] = cook
        if recipe:
            din["recipe"] = recipe
        din["ingredients"] = ingredients
        v["dinners"].append(din)
    # Half way round the shop: the fruit and veg and the bread are in the basket.
    v["bought"] = {d(0): ["lemon", "lime", "parsley", "basil", "cherry tomato", "spinach", "red cabbage", "potato", "pepper", "tortilla", "sourdough", "burger bun"]}
    v["extras"] = [{"id": "x1", "week": d(0), "name": "Oat milk", "qty": "2 l", "aisle": DE}, {"id": "x2", "week": d(0), "name": "Coffee", "aisle": DG}]
    write("meal-plan", v)


def workouts() -> None:
    v = start("workout-log")
    # Set up five weeks ago with the four suggested workouts, three sessions a week, in kilograms.
    for w in v["plan"]:
        w.pop("pick", None)
    v["units"] = "kg"
    v["started"] = d(-36)
    # Sixteen sessions in turn (Legs, Push, Pull, Easy run), the last a run yesterday, so Today shows
    # Legs next with what each exercise was last time. The weights creep up and stall here and there,
    # as they do: squat and deadlift set new bests, the last Push day sets none, the last run is the
    # fastest.
    days = [-35, -33, -31, -28, -26, -24, -21, -19, -17, -14, -12, -10, -7, -5, -3, -1]
    legs = [(90, 20), (92.5, 20), (95, 22.5), (100, 22.5)]
    push = [(60, 40, 8), (62.5, 40, 10), (65, 42.5, 12), (65, 42.5, 10)]
    pull = [(110, 50, 6), (115, 52.5, 7), (120, 55, 8), (125, 55, 8)]
    runs = [(5, 31), (5, 30.17), (6, 36.5), (5, 28.67)]
    efforts = [7, 6, 8, 5, 7, 7, 8, 6, 8, 6, 9, 5, 8, 7, 9, 6]
    notes = {5: "Felt strong", 12: "Left knee a bit sore on the last set", 15: "Fastest 5 km yet"}
    out = []
    for i, k in enumerate(days):
        r, n = i % 4, i // 4
        if r == 0:
            sq, lu = legs[n]
            s = {"name": "Legs", "workout": "legs", "items": [
                {"exercise": "squat", "sets": [{"reps": 5, "kg": sq}] * 3},
                {"exercise": "lunges", "sets": [{"reps": 10, "kg": lu}] * 3},
                {"exercise": "calf-raises", "sets": [{"reps": 12, "kg": 40}] * 3}]}
        elif r == 1:
            be, oh, di = push[n]
            s = {"name": "Push", "workout": "push", "items": [
                {"exercise": "bench-press", "sets": [{"reps": 6, "kg": be}] * 3},
                {"exercise": "overhead-press", "sets": [{"reps": 8, "kg": oh}] * 3},
                {"exercise": "dips", "sets": [{"reps": di}, {"reps": di - 2}]}]}
        elif r == 2:
            de, ro, pu = pull[n]
            s = {"name": "Pull", "workout": "pull", "items": [
                {"exercise": "deadlift", "sets": [{"reps": 3, "kg": de}] * 2},
                {"exercise": "rows", "sets": [{"reps": 8, "kg": ro}] * 3},
                {"exercise": "pull-ups", "sets": [{"reps": pu}, {"reps": pu - 1}, {"reps": pu - 2}]}]}
        else:
            km, mins = runs[n]
            s = {"name": "Easy run", "workout": "run", "items": [{"exercise": "run", "sets": [{"km": km, "min": mins}]}]}
        out.append({"id": f"s{i + 1}", "date": d(k), **s, "effort": efforts[i], **({"note": notes[i]} if i in notes else {})})
    v["sessions"] = out
    write("workout-log", v)


def jobs() -> None:
    v = start("job-hunt")
    # Nine applications across the five stages, the way a hunt looks three weeks in: two saved, three
    # waiting, two interviewing, an offer and two closed. Due today: an interview at 14:00 and a
    # follow-up two days late. Eight sent, four heard back: 50%.
    def job(id, company, role, stage, **f):
        return {"id": id, "company": company, "role": role, "stage": stage, **f, "steps": f.get("steps", []), "questions": f.get("questions", []), "ask": f.get("ask", [])}
    v["jobs"] = [
        job("finch", "Finch Bikes", "Product designer", "saved", link="finch.example/jobs/product-designer", steps=[{"id": "s1", "kind": "deadline", "date": d(2)}]),
        job("harbor", "Harbor Labs", "Design systems lead", "saved", salary="60–65k", contact="Ines Duarte, recruiter"),
        job("marlow", "Marlow Studio", "Design lead", "applied", applied=d(-9), steps=[{"id": "s2", "kind": "follow-up", "date": d(-2)}]),
        job("kestrel", "Kestrel Maps", "Senior product designer", "applied", applied=d(-4), salary="55k", steps=[{"id": "s3", "kind": "follow-up", "date": d(3)}]),
        job("quill", "Quill and Co", "UX lead", "applied", applied=d(-12)),
        job("tideway", "Tideway", "Senior designer", "interview", applied=d(-14), heard=d(-6), link="tideway.example/careers/senior-designer",
            salary="52–58k", contact="Karin Berg, design manager",
            notes="Karin cares more about plain prototypes than polish. Small team, ships weekly.",
            steps=[{"id": "s4", "kind": "interview", "what": "First interview", "date": d(0), "time": "14:00"}],
            questions=[
                {"q": "A project you're proud of?", "a": "The onboarding redesign: sign-ups up a fifth, support tickets down."},
                {"q": "How do you work with engineers?", "a": "Weekly reviews, plain prototypes early, ship small."},
                {"q": "Why Tideway?", "a": "I like untangling logistics, and the product is used every day."},
            ],
            ask=["How do design and support share what they hear?", "What would a good first three months look like?"]),
        job("brightline", "Brightline Studio", "Product designer", "interview", applied=d(-18), heard=d(-8),
            steps=[{"id": "s5", "kind": "interview", "what": "Second interview", "date": d(3), "time": "10:30"}]),
        job("lumen", "Lumen Health", "Senior designer", "offer", applied=d(-30), heard=d(-20), salary="58k",
            steps=[{"id": "s6", "kind": "follow-up", "what": "Answer the offer", "date": d(4)}]),
        job("northlight", "Northlight", "UX designer", "closed", outcome="rejected", applied=d(-25), heard=d(-15)),
        job("pebble", "Pebble Works", "Designer", "closed", outcome="no-reply", applied=d(-35)),
    ]
    v["started"] = d(-35)
    write("job-hunt", v)


def moods() -> None:
    v = start("mood-energy-log")
    # Six weeks of evenings, three of them missed, today not logged yet (it's an evening check-in,
    # so the stage shows the check-in). Written by hand to read like one person's weeks: energy
    # follows the night before, exercise and seeing friends lift the day, work stress pulls it
    # down, and a late Friday costs the Saturday's energy. Today is d(0); -1 is yesterday.
    E, A, S, W = "Exercise", "Alcohol", "Social", "Work stress"
    log = {
        -42: (3, 3, 7, [W], "Monday inbox"), -41: (4, 4, 7.5, [E], "Run by the river"), -40: (3, 2, 6, [W], "Late call with the US team"),
        -39: (4, 3, 7, [], None), -38: (4, 3, 6.5, [S, A], "Drinks after work"), -37: (3, 2, 6, [], "Slow Saturday"),
        -36: (5, 4, 8.5, [E, S], "Long walk with Maja"),
        -35: (3, 3, 7, [W], None), -34: (4, 4, 7.5, [E], "Gym before work"), -33: (2, 2, 5.5, [W], "Deadline, ate at my desk"),
        -32: (3, 2, 6, [W], None), -30: (4, 3, 7, [S, A], "Pizza with Oskar"),
        -29: (4, 4, 8, [E], "Swim and a nap"), -28: (3, 3, 7.5, [], "Laundry and a film"), -27: (3, 3, 7, [W], None),
        -26: (4, 4, 7.5, [E], "Gym, felt strong"), -25: (3, 3, 6.5, [], None), -24: (2, 1, 5, [W], "Up at 4 worrying about the review"),
        -23: (3, 2, 6, [A], "Quiet Friday"), -22: (4, 3, 8, [S], "Market with Maja"), -21: (4, 4, 8, [E], "Long run"),
        -20: (3, 3, 7, [W], None), -19: (4, 4, 7.5, [E], "Yoga at lunch"), -18: (3, 3, 7, [], None),
        -17: (4, 3, 7, [S], "Book club"), -16: (4, 3, 6.5, [S, A], "Work party"), -15: (3, 2, 5.5, [A], "Slept badly"),
        -14: (4, 4, 8, [E], "Cycled to the lake"),
        -13: (3, 3, 7, [W], None), -12: (4, 4, 7.5, [E], "Gym before work"), -11: (2, 2, 6, [W], "Back-to-back meetings"),
        -10: (3, 2, 5.5, [W], "Deadline"), -9: (4, 3, 7, [S], "Dinner at Oskar's"), -8: (5, 4, 8.5, [E, S], "Hike with friends"),
        -7: (4, 4, 8, [], "Lazy Sunday"),
        -6: (3, 3, 7, [W], None), -5: (4, 4, 7.5, [E], "Swim before work"), -4: (3, 3, 7, [], None),
        -3: (2, 2, 5.5, [W], "Project slipped again"), -2: (4, 3, 7, [S, A], "Friday drinks"), -1: (4, 3, 6.5, [E], "Short run, still tired"),
    }
    days = {}
    for n, (mood, energy, sleep, tags, note) in sorted(log.items()):
        day = {"mood": mood, "energy": energy, "sleep": sleep}
        if tags:
            day["tags"] = tags
        if note:
            day["note"] = note
        days[d(n)] = day
    v["days"] = days
    write("mood-energy-log", v)


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


def gifts() -> None:
    v = start("gift-ideas")
    # Six people a family buys for, five weeks before Christmas: Oskar's birthday in nine days with
    # his Lego bought, Christmas with four of six bought (1,549 of 4,300 kr), then the spring's
    # birthdays and an anniversary. Birthdays are written as dates so they move with today (the app
    # reads their day and month); past gifts carry their year. Mum's next idea is a scarf, and she
    # was given one in 2024, which her page points out.
    v["settings"] = {"currency": "kr", "christmas": "12-24"}
    def occ(id, kind, budget, date=None, **f):
        return {"id": id, "kind": kind, **({"date": d(date)} if date is not None else {}), "budget": budget, **f}
    v["people"] = [
        {"id": "mum", "name": "Mum", "likes": "Linen, her garden, good tea, anything from Arket", "sizes": "M, shoes 39",
         "has": "A good teapot, the Ottolenghi books", "occasions": [occ("birthday", "birthday", 600, 60), occ("christmas", "christmas", 800)]},
        {"id": "dad", "name": "Dad", "likes": "Hammarby, strong coffee, crime novels", "sizes": "L, shoes 44",
         "has": "Every scarf the club sells", "occasions": [occ("birthday", "birthday", 500, 150), occ("christmas", "christmas", 800)]},
        {"id": "sam", "name": "Sam", "likes": "Climbing, ceramics, natural wine", "sizes": "S, shoes 38, ring 52",
         "has": "New climbing shoes (May)", "occasions": [occ("anniversary", "anniversary", 1000, 130), occ("birthday", "birthday", 1000, 230), occ("christmas", "christmas", 1500)]},
        {"id": "oskar", "name": "Oskar", "likes": "Dinosaurs, Lego, drawing", "sizes": "Age 7, 122 cm",
         "has": "The big T. rex Lego, every dinosaur book in the library", "occasions": [occ("birthday", "birthday", 300, 9), occ("christmas", "christmas", 400)]},
        {"id": "maja", "name": "Maja", "likes": "Cooking, plants, weekends in Copenhagen",
         "has": "A stand mixer, too many candles", "occasions": [occ("birthday", "birthday", 500, 200), occ("christmas", "christmas", 500)]},
        {"id": "grandma", "name": "Grandma Inger", "likes": "Crosswords, her cat Sixten, photos of the kids",
         "has": "Every crossword book there is", "occasions": [occ("christmas", "christmas", 300)]},
    ]
    def idea(id, person, title, status, price=None, shop=None, occasion=None, **f):
        out = {"id": id, "person": person, "title": title}
        for k, x in (("price", price), ("shop", shop), ("occasion", occasion)):
            if x is not None:
                out[k] = x
        return {**out, **f, "status": status}
    v["ideas"] = [
        idea("scarf", "mum", "Blue wool scarf", "idea", 450, "Arket", "christmas", link="arket.example/blue-wool-scarf"),
        idea("apron", "mum", "Linen apron", "bought", 350, "Arket", "christmas"),
        idea("kneeler", "mum", "Garden kneeler and gloves", "idea", 280, "Plantagen", "birthday"),
        idea("tickets", "dad", "Hammarby home match, two tickets", "wrapped", 700, "Hammarby shop", "christmas"),
        idea("moka", "dad", "Moka pot", "idea", 390, "Cervera"),
        idea("pottery", "sam", "Pottery course for two", "idea", 1800, "Keramikverkstan", "christmas"),
        idea("chalk", "sam", "Chalk bag", "bought", 249, "Addnature", "christmas"),
        idea("robyn", "sam", "Robyn concert tickets", "idea", 1100, "Ticketmaster", "anniversary"),
        idea("raptor", "oskar", "Lego Jurassic raptor set", "bought", 299, "Lekia", "birthday"),
        idea("pyjamas", "oskar", "Dinosaur pyjamas", "idea", 249, "Lindex", "christmas"),
        idea("pencils", "oskar", "Watercolour pencils", "idea", 150, "Panduro"),
        idea("knife", "maja", "A good chef's knife", "idea", 900, "Knivkompaniet", "christmas"),
        idea("fig", "maja", "Fig tree", "idea", 350, "Plantagen"),
        idea("calendar", "grandma", "Photo calendar of the kids", "bought", 250, "Ifolor", "christmas"),
        idea("old-scarf", "mum", "Wool scarf", "given", 400, None, "christmas", year=2024),
        idea("old-book", "mum", "Ottolenghi Simple", "given", 299, None, "birthday", year=2025),
        idea("old-novels", "dad", "Crime novel box set", "given", 450, None, "christmas", year=2025),
        idea("old-mugs", "sam", "Handmade mug set", "given", 600, None, "birthday", year=2025),
        idea("old-rex", "oskar", "T. rex Lego", "given", 399, None, "christmas", year=2025),
        idea("old-pasta", "maja", "Pasta machine", "given", 600, None, "birthday", year=2024),
    ]
    v["started"] = d(-200)
    write("gift-ideas", v)


habits()
budget()
flashcards()
trip()
meals()
workouts()
jobs()
moods()
home()
gifts()
print("wrote", ", ".join(sorted(p.name for p in OUT.glob("*.sample.json"))))
