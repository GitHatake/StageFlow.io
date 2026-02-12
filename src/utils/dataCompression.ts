import pako from 'pako';
import { v4 as uuidv4 } from 'uuid';
import type { Event, Performance, Member, Block } from '../types';

// Simplified types for minification
type MinifiedMember = [string, string]; // [id, name]
type MinifiedBlock = [string, string]; // [id, name]
type MinifiedPerformance = [string, number, string, number, string[], string]; // [id, type(0:team,1:break), title, duration, memberIds, preferredBlock]

interface MinifiedEvent {
    n: string; // name
    i: number; // interval
    m: MinifiedMember[];
    p: MinifiedPerformance[];
    b: MinifiedBlock[];
}

const TYPE_MAP: { [key: string]: number } = {
    'team': 0,
    'break': 1,
};

const TYPE_MAP_REV: { [key: number]: 'team' | 'break' } = {
    0: 'team',
    1: 'break',
};

export function compressEventData(event: Event): string {
    const minified: MinifiedEvent = {
        n: event.name,
        i: event.interval,
        m: event.members.map(m => [m.id, m.name]),
        p: event.performances.map(perf => [
            perf.id,
            TYPE_MAP[perf.type] ?? 0,
            perf.title,
            perf.duration,
            perf.memberIds,
            perf.preferredBlock || ''
        ]),
        b: event.blocks.map(b => [b.id, b.name])
    };

    const jsonString = JSON.stringify(minified);
    const compressed = pako.deflate(jsonString);

    // Uint8Array to Binary String
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
    }

    // Binary String to Base64
    return btoa(binary);
}

export function decompressEventData(base64: string): Partial<Event> | null {
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const decompressed = pako.inflate(bytes, { to: 'string' });
        const minified: MinifiedEvent = JSON.parse(decompressed);

        const members: Member[] = minified.m.map(([id, name]) => ({ id, name }));
        const blocks: Block[] = minified.b ? minified.b.map(([id, name], index) => ({ id, name, order: index })) : [];

        const performances: Performance[] = minified.p.map(([id, typeCode, title, duration, memberIds, preferredBlock], index) => ({
            id,
            type: TYPE_MAP_REV[typeCode] || 'team',
            title,
            duration,
            memberIds,
            preferredBlock,
            order: index
        }));

        return {
            id: uuidv4(),
            name: minified.n,
            interval: minified.i,
            members,
            performances,
            blocks,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

    } catch (error) {
        console.error('Decompression failed:', error);
        return null;
    }
}
