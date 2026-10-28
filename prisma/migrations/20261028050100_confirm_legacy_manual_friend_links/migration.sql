-- Confirmed legacy direct additions; never override a recorded application.
UPDATE "FriendLink" SET "origin" = 'MANUAL'
WHERE "origin" = 'UNKNOWN' AND "sourceApplicationId" IS NULL AND "url" IN (
  'https://yarinaoshi.top/',
  'https://blog.qwq.my/',
  'https://wiki.hydcraft.cn/',
  'https://blog.frost-zx.top/',
  'https://bg7qvu.cn/'
);
