#!/usr/bin/env python3
"""Minimal stdlib-only validator for repository skeleton and generated cycles.

Usage:
  python tools/validate_project.py --project
  python tools/validate_project.py --cycle 001

This checks structure, identifiers, required headings and arithmetic, NOT teaching quality
or the existence/accessibility of external educational links.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'AGENTS.md', 'README.md',
    'docs/LEARNER_PROFILE.md', 'docs/PROJECT_CONTRACT.md',
    'docs/CURRICULUM_SPEC.md', 'docs/CYCLE_SPEC.md',
    'docs/METHODOLOGY.md', 'docs/RESOURCE_POLICY.md',
    'curriculum/README.md', 'curriculum/resources.md',
    'state/current-cycle.md', 'state/cycle-ledger.md',
    'state/learning-record.md', 'state/recurring-mistakes.md',
    'workflows/01-initialize.md', 'workflows/02-generate-next-cycle.md',
    'workflows/03-record-progress.md', 'workflows/04-review-cycle.md',
    'workflows/05-repair-resources.md',
    'templates/lesson.md', 'templates/weekly-review.md',
    'templates/master-curriculum.md', 'templates/cycle-overview.md',
]


def check_project():
    problems = [f'Missing {p}' for p in REQUIRED if not (ROOT / p).is_file()]
    if not (ROOT / 'study-plans').is_dir():
        problems.append('Missing study-plans/ directory')
    if not (ROOT / 'practice/writing').is_dir() or not (ROOT / 'practice/speaking').is_dir():
        problems.append('Missing practice directories')
    print(f'PROJECT: {"PASS" if not problems else "FAIL"}')
    return problems


def activity_minutes(path: Path):
    text = path.read_text(encoding='utf-8')
    start_tag = '<!-- ACTIVITY_TABLE_START -->'
    end_tag = '<!-- ACTIVITY_TABLE_END -->'
    if text.count(start_tag) != 1 or text.count(end_tag) != 1:
        return None, 'Expected exactly one activity table marker pair'
    part = text.split(start_tag, 1)[1].split(end_tag, 1)[0]
    total, rows = 0, 0
    for raw in part.splitlines():
        line = raw.strip()
        if not line.startswith('|'):
            continue
        cols = [c.strip() for c in line.strip('|').split('|')]
        if not cols or cols[0].lower() in ('step', '---', ':---') or re.fullmatch(r'[-: ]+', cols[0]):
            continue
        if len(cols) != 5 or not re.fullmatch(r'\d+', cols[-1]):
            return None, f'Invalid activity row: {line[:100]}'
        total += int(cols[-1]); rows += 1
    if rows == 0:
        return None, 'Activity table has no numeric rows'
    return total, None


def check_cycle(cycle: str):
    number = int(cycle)
    cycle_path = ROOT / 'study-plans' / f'cycle-{number:03d}'
    errors = []
    if not cycle_path.is_dir():
        return [f'Cycle directory not found: {cycle_path.relative_to(ROOT)}']
    overview = cycle_path / 'overview.md'
    if not overview.exists():
        errors.append('Missing overview.md')
    plan = cycle_path / 'plan.md'
    count, reviews, minutes = 20, 4, 120  # Legacy cycles retain their original contract.
    if plan.exists():
        content = plan.read_text(encoding='utf-8')
        values = []
        for key, low, high in [('Lesson count', 1, 40), ('Review count', 0, 8), ('Session minutes', 10, 240)]:
            matches = re.findall(r'^- \*\*' + key + r':\*\* (\d+)$', content, re.M)
            if len(matches) != 1 or not low <= int(matches[0]) <= high:
                return [f'Invalid plan.md field: {key}']
            values.append(int(matches[0]))
        count, reviews, minutes = values
        if reviews not in (0, (count + 4) // 5):
            return ['Review count must be zero or one per five-lesson block, including the final partial block']
    paths = []
    for week in range(1, (count + 4) // 5 + 1):
        weekdir = cycle_path / f'week-{week:02d}'
        for idx in range((week - 1) * 5 + 1, min(week * 5, count) + 1):
            paths.append((weekdir / f'lesson-{idx:02d}.md', f'C{number:03d}-L{idx:02d}', False))
        if reviews: paths.append((weekdir / 'review.md', f'C{number:03d}-R{week:02d}', True))
    actual_lessons = sorted(cycle_path.glob('week-*/lesson-*.md'))
    actual_reviews = sorted(cycle_path.glob('week-*/review.md'))
    if len(actual_lessons) != count:
        errors.append(f'Expected {count} lessons, found {len(actual_lessons)}')
    if len(actual_reviews) != reviews:
        errors.append(f'Expected {reviews} reviews, found {len(actual_reviews)}')
    for path, lesson_id, review in paths:
        if not path.is_file():
            errors.append(f'Missing {path.relative_to(cycle_path)}')
            continue
        text = path.read_text(encoding='utf-8')
        if not re.search(r'^#\s+'+re.escape(lesson_id)+r'\b', text, re.M):
            errors.append(f'{path.name}: expected heading {lesson_id}')
        total, problem = activity_minutes(path)
        if problem:
            errors.append(f'{path.relative_to(cycle_path)}: {problem}')
        elif total != minutes:
            errors.append(f'{path.relative_to(cycle_path)}: timed activities = {total}, expected {minutes}')
        needs = ['Feedback', 'Review'] if not review else ['Feedback']
        for term in needs:
            if term.lower() not in text.lower():
                errors.append(f'{path.relative_to(cycle_path)}: missing {term} section')
        if not review:
            for term in ['objective', 'production', 'completion', 'resource', 'fluency']:
                if term.lower() not in text.lower():
                    errors.append(f'{path.relative_to(cycle_path)}: missing {term} indication')
    if overview.is_file():
        content = overview.read_text(encoding='utf-8')
        for path, _lesson_id, _review in paths:
            if str(path.relative_to(cycle_path)).replace('\\','/') not in content:
                errors.append(f'overview.md: missing link to {path.relative_to(cycle_path)}')
    print(f'CYCLE {number:03d}: {"PASS" if not errors else "FAIL"} '
          f'({len(actual_lessons)} lessons, {len(actual_reviews)} reviews)')
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', action='store_true')
    parser.add_argument('--cycle', type=str, help='cycle number, e.g. 001')
    args = parser.parse_args()
    if not (args.project or args.cycle):
        parser.print_help(); return 2
    problems = []
    if args.project: problems.extend(check_project())
    if args.cycle:
        if not args.cycle.isdigit() or int(args.cycle) <= 0:
            parser.error('--cycle must be a positive integer like 001')
        problems.extend(check_cycle(args.cycle))
    for p in problems:
        print(f'ERROR: {p}')
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
