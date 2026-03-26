import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../..');

const gems = window.GAME_DATA.gems;
const bugs = window.GAME_DATA.bugs;
const moves = window.GAME_DATA.moves;
const trainers = window.GAME_DATA.trainers;
const gymLeaders = window.GAME_DATA.gymLeaders;
const encounters = window.GAME_DATA.encounters;
const marts = window.GAME_DATA.marts;

describe('Data Integrity', () => {
  describe('gem learnsets reference valid moves', () => {
    for (const [gemId, gem] of Object.entries(gems)) {
      for (const entry of gem.learnset) {
        it(`${gemId} learnset move "${entry.move}" exists`, () => {
          expect(moves[entry.move]).toBeDefined();
        });
      }
    }
  });

  describe('gem types are valid', () => {
    for (const [gemId, gem] of Object.entries(gems)) {
      it(`${gemId} has valid type "${gem.type}"`, () => {
        expect(TYPES).toContain(gem.type);
      });
    }
  });

  describe('bug types are valid', () => {
    for (const [bugId, bug] of Object.entries(bugs)) {
      it(`${bugId} has valid type "${bug.type}"`, () => {
        expect(TYPES).toContain(bug.type);
      });
    }
  });

  describe('bug moves reference valid moves', () => {
    for (const [bugId, bug] of Object.entries(bugs)) {
      for (const moveId of bug.moves) {
        it(`${bugId} move "${moveId}" exists`, () => {
          expect(moves[moveId]).toBeDefined();
        });
      }
    }
  });

  describe('move types are valid', () => {
    for (const [moveId, move] of Object.entries(moves)) {
      it(`${moveId} has valid type "${move.type}"`, () => {
        expect(TYPES).toContain(move.type);
      });
    }
  });

  describe('status moves have valid effects', () => {
    for (const [moveId, move] of Object.entries(moves)) {
      if (move.category === 'status') {
        it(`${moveId} has valid effect structure`, () => {
          expect(move.effect).not.toBeNull();
          expect(['attack', 'defense', 'spAttack', 'spDefense', 'speed']).toContain(move.effect.stat);
          expect(['self', 'enemy']).toContain(move.effect.target);
          expect(move.effect.stages).not.toBe(0);
        });
      }
    }
  });

  describe('trainer parties reference valid bugs', () => {
    for (const [trainerId, trainer] of Object.entries(trainers)) {
      for (const p of trainer.party) {
        it(`${trainerId} party bug "${p.bugId}" exists`, () => {
          expect(bugs[p.bugId]).toBeDefined();
        });
      }
    }
  });

  describe('gym leader parties reference valid bugs', () => {
    for (const [leaderId, leader] of Object.entries(gymLeaders)) {
      for (const p of leader.party) {
        it(`${leaderId} party bug "${p.bugId}" exists`, () => {
          expect(bugs[p.bugId]).toBeDefined();
        });
      }
    }
  });

  describe('encounter tables reference valid bugs', () => {
    for (const [routeId, route] of Object.entries(encounters)) {
      for (const enc of route.encounters) {
        it(`${routeId} encounter bug "${enc.bugId}" exists`, () => {
          expect(bugs[enc.bugId]).toBeDefined();
        });
      }
    }
  });

  describe('mart inventories reference valid gems', () => {
    for (const [martId, mart] of Object.entries(marts)) {
      for (const item of mart.inventory) {
        it(`${martId} item gem "${item.gemId}" exists`, () => {
          expect(gems[item.gemId]).toBeDefined();
        });
      }
    }
  });

  describe('encounter zone IDs match OverworldScene', () => {
    it('all encounter zone IDs used in code exist in encounters.json', () => {
      const overworldSrc = fs.readFileSync(
        path.join(ROOT, 'src/scenes/OverworldScene.js'), 'utf8'
      );
      // Extract encounter zone IDs passed to generateRoute
      const matches = overworldSrc.matchAll(/generateRoute\(\s*['"]([^'"]+)['"]/g);
      for (const match of matches) {
        const zoneId = match[1];
        expect(encounters[zoneId], `encounter zone "${zoneId}" missing from encounters.json`).toBeDefined();
      }
    });
  });

  describe('no gem has zero or negative base stats', () => {
    for (const [gemId, gem] of Object.entries(gems)) {
      it(`${gemId} has positive base stats`, () => {
        for (const [stat, value] of Object.entries(gem.baseStats)) {
          expect(value, `${gemId}.${stat}`).toBeGreaterThan(0);
        }
      });
    }
  });
});
