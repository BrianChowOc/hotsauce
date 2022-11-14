const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.getAllSauce = (req, res) => {
  Sauce.find()
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.createSauce = (req, res) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    likes: 0,
    dislikes: 0,
  });
  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce created" });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.modifySauce = (req, res) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ error });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink("images/" + filename, (err) => {
          if (err) console.log("ERROR: ", err);
          else {
            console.log("\nDeleted file: " + filename);
          }
        });
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Sauce modified" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ error });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink("images/" + filename, (err) => {
          if (err) console.log("ERROR: ", err);
          else {
            console.log("\nDeleted file: " + filename);
          }
        });
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce deleted" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.likeSauce = (req, res) => {
  const like = req.body.like;
  const userId = req.body.userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      let sauceObject = { ...sauce._doc };
      let usersLikeTab = sauceObject.usersLiked;
      let usersDislikeTab = sauceObject.usersDisliked;
      const likeNb = sauceObject.likes;
      const dislikeNb = sauceObject.dislikes;

      switch (like) {
        case 1:
          const indexDislike = usersDislikeTab.indexOf(userId);
          usersLikeTab.push(userId);
          if (indexDislike > -1) {
            usersDislikeTab.splice(indexDislike, 1);
          }
          sauceObject = {
            ...sauceObject,
            usersLiked: usersLikeTab,
            usersDisliked: usersDislikeTab,
            likes: likeNb + 1,
          };
          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject })
            .then(() => {
              res.status(200).json({ message: "Like updated" });
            })
            .catch((error) => res.status(400).json({ error }));
          break;

        case -1:
          const indexLike = usersLikeTab.indexOf(userId);
          usersDislikeTab.push(userId);
          if (indexLike > -1) {
            usersLikeTab.splice(indexLike, 1);
          }
          sauceObject = {
            ...sauceObject,
            usersLiked: usersLikeTab,
            usersDisliked: usersDislikeTab,
            dislikes: dislikeNb + 1,
          };

          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject })
            .then(() => {
              res.status(200).json({ message: "Dislike updated" });
            })
            .catch((error) => res.status(400).json({ error }));
          break;

        case 0:
          const indexlike = usersLikeTab.indexOf(userId);
          if (indexlike > -1) {
            usersLikeTab.splice(indexlike, 1);
            sauceObject = {
              ...sauceObject,
              usersLiked: usersLikeTab,
              likes: likeNb - 1,
            };
          } else {
            usersDislikeTab.splice(usersDislikeTab.indexOf(userId), 1);
            sauceObject = {
              ...sauceObject,
              usersDisliked: usersDislikeTab,
              dislikes: dislikeNb - 1,
            };
          }
          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject })
            .then(res.status(200).json({ message: "Like/Dislike updated" }))
            .catch((error) => res.status(400).json({ error }));
          break;
      }
    })
    .catch((error) => res.status(400).json({ error }));
};
