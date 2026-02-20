// ==UserScript==
// @name         VGMdb Export Album JSON
// @namespace    vgmdb-export
// @version      1.0
// @description  Export album data from VGMdb as JSON for AMQBot import
// @author       Kyrch
// @match        https://vgmdb.net/album/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @downloadURL https://raw.githubusercontent.com/Kyrch/AMQBot-VGMdb-Importer/main/export-vgmdb.user.js
// @updateURL   https://raw.githubusercontent.com/Kyrch/AMQBot-VGMdb-Importer/main/export-vgmdb.user.js
// ==/UserScript==

(function () {
    'use strict';

    const clean = s => s?.replace(/\s+/g, ' ')?.trim();
    const cleanTitle = s => s?.replace(/^\s*\/\s*/, '')?.replace(/\s+/g, ' ')?.trim() || null;

    const cleanVocal = s => {
        if (!s) return null;

        // Keep only the part BEFORE the slash (romanized name)
        if (s.includes('/')) {
            s = s.split('/')[0];
        }

        return s?.replace(/\s+/g, ' ')?.trim();
    };

    const text = el => clean(el?.textContent);

    /* ---------- TITLES ---------- */
    function getTitles() {
        const h1 = document.querySelector('#innermain h1');

        if (!h1) return {};

        const titles = {};
        h1.querySelectorAll('span[lang]').forEach(s => {
            titles[s.getAttribute('lang')] = cleanTitle(s.textContent);
        });

        if (!Object.keys(titles).length) {
            titles.main = cleanTitle(h1.textContent);
        }

        return titles;
    }

    /* ---------- DATE ---------- */
    function getReleaseDate() {
        const rows = document.querySelectorAll('#album_infobit_large tr');

        for (const r of rows) {
            const label = r.querySelector('td b');

            if (!label) continue;
            if (!/release date/i.test(label.textContent)) continue;

            const val = label.closest('td').nextElementSibling;

            if (!val) continue;

            return clean(val.querySelector('a')?.textContent ?? val.textContent);
        }

        return null;
    }

    /* ---------- VOCALS ---------- */
    function getVocals() {
        const set = new Set();

        const credit = [...document.querySelectorAll('h2,h3')]
            .find(h => /credits/i.test(h.textContent));

        if (!credit) return [];

        let n = credit.nextElementSibling;
        while (n && !/^H[23]$/.test(n.tagName)) {
            n.querySelectorAll('tr').forEach(r => {

                const roleSpan = r.querySelector('.artistname[lang="en"][style*="inline"]');
                if (!roleSpan) return;

                const roleText = roleSpan.textContent.trim();
                if (!/^(Vocals?|Singer?)$/i.test(roleText)) return;

                const cell = r.querySelector('td + td');
                if (!cell) return;

                const names = cell.textContent.split(/[,;]/);

                names.forEach(nameStr => {
                    const name = cleanVocal(nameStr);
                    if (name) set.add(name);
                });
            });

            n = n.nextElementSibling;
        }

        return [...set];
    }

    /* ---------- TRACKS ---------- */
    function getTracks() {

        const result = {};
        const nav = document.querySelectorAll('#tlnav a[rel]');

        nav.forEach(link => {

            const lang = text(link);
            const id = link.getAttribute('rel');
            const container = document.querySelector(`span#${id}`);

            if (!container) return;

            const discs = [];

            container.querySelectorAll('table').forEach(t => {
                const tracks = [];

                t.querySelectorAll('tr').forEach(r => {
                    const cols = r.querySelectorAll('td');

                    if (cols.length < 2) return;

                    const name = clean(cols[1].textContent);

                    if (name) tracks.push(name);
                });

                if (tracks.length) discs.push({ tracks, count: tracks.length });
            });

            if (discs.length) result[lang] = discs;
        });

        return result;
    }

    /* ---------- EXPORT ---------- */
    function exportAlbum() {
        const data = {
            url: location.href,
            titles: getTitles(),
            releaseDate: getReleaseDate(),
            vocals: getVocals(),
            tracklists: getTracks()
        };

        console.log('VGMDB EXPORT', data);
        GM_setClipboard(JSON.stringify(data, null, 2));

        alert('Album JSON copied ✔');
    }

    /* ---------- BUTTON ---------- */
    const btn = document.createElement('button');
    btn.textContent = 'Export Album JSON';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '10px 14px',
        background: '#2e7dff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    });
    btn.onclick = exportAlbum;
    document.body.appendChild(btn);
})();
