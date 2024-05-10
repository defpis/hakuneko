import WordPressMadara from './templates/WordPressMadara.mjs';
import Manga from '../engine/Manga.mjs';
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';

// WordPressMadara clone without running WordPress ...
export default class Hanman18 extends WordPressMadara {

    constructor() {
        super();
        super.id = 'hanman18';
        super.label = 'Hanman18';
        this.tags = [ 'manga', 'webtoon', 'hentai', 'chinese' ];
        this.url = 'https://hanman18.com';
    }

    // 获取标题
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.detail_name > h1');
        const id = uri.pathname;
        const title = data[0].textContent.trim();
        return new Manga(this, id, title);
    }

    // 遍历章节列表
    async _getMangas() {
        const lastID = list => list.length ? list[list.length - 1].id : null;
        let mangaList = [];
        for (let page = 1, run = true; run; page++) {
            let mangas = await this._getMangasFromPage(page);
            mangas.length > 0 && lastID(mangas) !== lastID(mangaList) ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }

    // 遍历漫画列表
    async _getMangasFromPage(page) {
        const request = new Request(new URL('/list-manga/' + page, this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'div.story_item div.mg_info div.mg_name a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }

    // 获取章节列表
    async _getChapters(manga) {
        const request = new Request(new URL(manga.id, this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'div.chapter_box ul li a.chapter_num');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }

    // 获取每一张图片
    async _getPages(chapter) {
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        const scripts = await this.fetchDOM(request, 'script');
        const scriptContent = scripts[5].textContent;
        const data = JSON5.parse(scriptContent.match(/var slides_p_path = ([\S\s]*);[\S\s]*\$\(document\)/)[1]).map(item => atob(item));
        return data.map(image => this.createConnectorURI({
            url: this.getAbsolutePath(image, request.url),
            referer: request.url
        }));
    }
}
