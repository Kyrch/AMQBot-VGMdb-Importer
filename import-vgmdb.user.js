// ==UserScript==
// @name         AMQBot Import VGMdb JSON
// @namespace    amqbot-import
// @version      1.0
// @description  Import album data from VGMdb Export
// @author       Kyrch
// @match        https://amqbot.082640.xyz/*
// @grant        GM_getClipboard
// @run-at       document-idle
// @downloadURL https://raw.githubusercontent.com/Kyrch/AMQBot-VGMdb-Importer/main/import-vgmdb.user.js
// @updateURL   https://raw.githubusercontent.com/Kyrch/AMQBot-VGMdb-Importer/main/import-vgmdb.user.js
// ==/UserScript==

(function () {
    'use strict';

    const log = (...a) => console.log('[AMQBot Import]', ...a);

    /* ---------- HELPERS ---------- */
    const setInput = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = val || '';
        el.classList.remove('rz-state-empty');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    const setSpinnerValue = (el, val) => {
        if (!el) return;
        el.value = val || '';
        el.classList.remove('rz-state-empty');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    /* ---------- TRACK INSERT ---------- */
    function fillTracks(json) {
        if (!json.tracklists) {
            alert('No tracklists in JSON');
            return;
        }

        const langs = Object.keys(json.tracklists);

        if (!langs.length) return;

        const english = langs.find(l => /english/i.test(l));
        const chinese = langs.find(l => /chinese|zh/i.test(l));
        const primaryLang = english || langs[0];
        const originalLang = chinese || langs[0];

        const tracklists = json.tracklists[primaryLang];
        const originalTracklists = json.tracklists[originalLang];

        const dataGrids = document.querySelectorAll('.rz-data-grid');

        tracklists.forEach((discData, discIndex) => {
            if (discIndex >= dataGrids.length) {
                log('No data grid for disc', discIndex, '- skipped');
                return;
            }

            const grid = dataGrids[discIndex];
            const tbody = grid.querySelector('tbody');
            if (!tbody) {
                log('No tbody for grid', discIndex, '- skipped');
                return;
            }

            const rows = tbody.querySelectorAll('tr');
            const primaryTracks = discData.tracks;
            const originalTracks = (originalTracklists[discIndex] && originalTracklists[discIndex].tracks) || [];

            if (rows.length < primaryTracks.length) {
                log('Warning: disc', discIndex, 'has fewer rows than tracks (rows:', rows.length, 'tracks:', primaryTracks.length, ')');
            }

            const fillCount = Math.min(rows.length, primaryTracks.length);

            for (let trackIndex = 0; trackIndex < fillCount; trackIndex++) {
                const inputs = rows[trackIndex].querySelectorAll('input');
                if (inputs.length < 3) {
                    log('Skipping row', trackIndex, 'in disc', discIndex, '- not enough inputs');
                    continue;
                }

                inputs[0].value = originalTracks[trackIndex] || primaryTracks[trackIndex];
                inputs[1].value = primaryTracks[trackIndex];
                inputs[2].value = (json.vocals || []).join(', ');

                inputs.forEach(inp => {
                    inp.classList.remove('rz-state-empty');
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inp.dispatchEvent(new Event('blur', { bubbles: true }));
                });
            }
        });
    }

    /* ---------- IMPORT ---------- */
    async function importAlbum() {
        const text = await navigator.clipboard.readText();
        if (!text) {
            alert('Clipboard empty');
            return;
        }

        let json;
        try {
            json = JSON.parse(text);
        } catch {
            alert('Clipboard is not JSON');
            return;
        }

        log('IMPORT', json);

        const title = json.titles?.en
            || json.titles?.main
            || Object.values(json.titles || {})[0]
            || '';

        const original = json.titles?.zh
            || json.titles?.ja
            || json.titles?.main
            || json.titles?.en
            || title;

        setInput('AlbumName', title);
        setInput('OriginalAlbumName', original);

        if (json.releaseDate) {
            const year = json.releaseDate.match(/\d{4}/);
            if (year) {
                const yr = document.querySelector('.rz-spinner-input');
                if (yr) {
                    setSpinnerValue(yr, year[0]);
                }
            }
        }

        fillTracks(json);

        alert('Album imported ✔');
    }

    /* ---------- BUTTON ---------- */
    const btn = document.createElement('button');
    btn.textContent = 'Import VGMdb JSON';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: 9999,
        padding: '10px 14px',
        background: '#2e7dff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    });
    btn.onclick = importAlbum;
    document.body.appendChild(btn);

    log('Importer ready');
})();
