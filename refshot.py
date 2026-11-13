from playwright.sync_api import sync_playwright
u="https://lucilia-castro-aulas.vercel.app/"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for name,w,h in [("desktop",1280,800),("mobile",390,844)]:
        pg=b.new_page(viewport={"width":w,"height":h})
        pg.goto(u,wait_until="networkidle")
        H=pg.evaluate("document.body.scrollHeight")
        for y in range(0,H,300): pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(150)
        pg.wait_for_timeout(1500); pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(3500)
        pg.screenshot(path=f"/tmp/ref-{name}-hero.png")
        H=pg.evaluate("document.documentElement.scrollHeight")
        pg.screenshot(path=f"/workspace/yasmin/ref-lucilia-{name}.png",full_page=True,clip={"x":0,"y":0,"width":w,"height":H})
        print(name,H)
    b.close()
