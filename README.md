# echarts-map-download

这是node脚本，用于下载：https://datav.aliyun.com/portal/school/atlas/area_selector 的中国地图及其下钻省市区的json文件。在echarts或者leaflet展示。

以下是脚本的完整流程：

下载并解析all.json文件。
遍历all.json中的JSON数组，对于每个adcode：
检查dist目录下是否已经存在adcode.json文件，如果不存在，则下载并保存。
如果adcode的最后两位不为00，检查dist目录下是否已经存在adcode_full.json文件，如果不存在，则下载并保存。(有些市最后两位可能为00，即没有下属区 则不理它，如东莞市)
如果有失败的下载，尝试重新下载失败的文件。
输出下载结果和跳过的文件列表。