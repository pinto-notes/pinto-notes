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
    v["started"] = d(-35)
    write("job-hunt", v)


habits()
budget()
flashcards()
trip()
meals()
workouts()
jobs()
print("wrote", ", ".join(sorted(p.name for p in OUT.glob("*.sample.json"))))
