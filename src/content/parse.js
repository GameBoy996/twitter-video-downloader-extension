export default function (response) {
  console.log("[TEST LOG] parseRequest response:", response);

  // tweet entites
  const entities = [...find(response, "extended_entities")];
  console.log("[TEST LOG] parseRequest entities:", entities);

  // tweet card entites
  const cards = [...find(response, "string_value")]
    .map(function (value) {
      try {
        const parsedValue = JSON.parse(value.string_value);
        const mediaEntity = Object.values(parsedValue.media_entities)
          .filter(function (media) {
            return ["video", "animated_gif"].indexOf(media.type) > -1;
          })
          .shift();
        if (mediaEntity) {
          return {
            extended_entities: {
              media: [mediaEntity],
            },
            id_str: mediaEntity.id_str,
          };
        }
      } catch (e) {
        return false;
      }
      return false;
    })
    .filter(Boolean);

  console.log("[TEST LOG] parseRequest cards:", cards);

  return [...cards, ...entities]
    .filter(function (entity) {
      return entity.extended_entities.media.filter(checkMediaHasVideo).length;
    })
    .flatMap(function (entity) {
      const entityId = entity.id_str || entity.conversation_id_str;
      const {
        extended_entities: { media },
      } = entity;
      return media.filter(checkMediaHasVideo).map(function (item) {
        const video = item.video_info.variants
          .filter(function (variant) {
            return variant.content_type === "video/mp4";
          })
          .sort(function (first, second) {
            return second.bitrate - first.bitrate;
          })
          .shift();
        return {
          id: item.id_str,
          type: item.type, // 资源类型，video or animated_gif
          entityId: entityId,
          photo: item.media_url_https, // 视频封面图
          video: video.url,
          width: item.original_info.width,
          height: item.original_info.height,
          text: textify(entity),
        };
      });
    })
    .filter(function (video, index, self) {
      return self.indexOf(video) === index;
    });
}

function find(source, key, list = []) {
  if (!source) {
    return list;
  }

  if (typeof source !== "object") {
    return list;
  }

  if (typeof source[key] !== "undefined") {
    list.push(source);
  } else {
    Object.values(source).forEach(function (deep) {
      list.push(...find(deep, key));
    });
  }

  return list;
}

function textify(entity) {
  const entityId = entity.id_str || entity.conversation_id_str;

  if (!entity.full_text) {
    return entityId;
  }

  let text = entity.full_text
    .split("https://t.co")[0]
    .trim()
    .replace(/(\r\n|\n|\r)/gm, "")
    .substr(0, 50);

  if (!text) {
    text = entityId;
  }

  return text;
}

function checkMediaHasVideo(media) {
  console.log("[TEST LOG] checkMediaHasVideo media.type:", media.type);
  return media.type === "video" || media.type === "animated_gif";
}
